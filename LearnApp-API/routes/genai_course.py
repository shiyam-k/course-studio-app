import os
import json
import uuid
from typing import Dict, Any
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from datetime import datetime
import asyncio
import logging
from utils.genai import save_result, logger, MODEL_MAP
from utils.helper import map_inputs, get_difficulty_level
from models.course_creation import GenaiInput, ProgressUpdate
from services.genai_service import GenaiService
from prompts.PROMPTS import INPUT_MAPPING

# Configure logging
logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

router = APIRouter(prefix="/genai-courses", tags=["courses"])

async def update_progress(
    websocket: WebSocket,
    request_id: str,
    step: str,
    status: int,
    progress_map: Dict[str, Any],
    course_map: Dict[str, Any],
    response_dir: str,
    path: str | None = None,
    error: str | None = None
) -> None:
    logger.info(f"Updating progress for step {step}: status={status}, path={path}, error={error}")
    # Prevent updating to a lower status unless it's an error (status: 3)
    if progress_map[step]["status"] > status and status != 3:
        logger.info(f"Skipping progress update for {step}: current status {progress_map[step]['status']} > new status {status}")
        return

    # Update progress_map
    progress_map[step].update({
        "status": status,
        "timestamp": datetime.utcnow().isoformat() + "Z" if status in [1, 2, 3] else None,
        "path": path,
        "error": error
    })

    # Calculate progress based on step order
    total_steps = len(progress_map)
    step_order = ["course_outline", "course_weeks", "week_plans", "course_milestone"]
    current_step_index = step_order.index(step) if step in step_order else 0
    completed_steps = sum(1 for s in progress_map.values() if s["status"] == 2)
    in_progress_steps = sum(1 for s in progress_map.values() if s["status"] == 1)
    
    # Progress calculation: each step contributes 25% (12.5% for in-progress, 25% for completed)
    base_progress = ((completed_steps * 1.0 + in_progress_steps * 0.5) / total_steps) * 100
    min_progress = ((current_step_index + (1 if status == 2 else 0.5 if status == 1 else 0)) / total_steps) * 100
    progress_percentage = max(int(base_progress), int(min_progress))

    update = ProgressUpdate(
        step=step,
        status=status,
        timestamp=progress_map[step]["timestamp"],
        path=path,
        error=error,
        progress=progress_percentage
    )
    logger.info(f"Sending WebSocket update: {update.model_dump()}")
    await websocket.send_json(update.model_dump())

    try:
        progress_path = f"{response_dir}/progress.json"
        course_map_path = "responses/1coursemaps.json"
        await save_result(progress_map, progress_path)
        course_map[str(request_id)] = progress_map
        await save_result(course_map, course_map_path)
    except Exception as e:
        logger.error(f"Failed to save progress map for step {step}: {str(e)}")
        raise


@router.websocket("/generate")
async def generate_course(websocket: WebSocket):
    await websocket.accept()
    request_id = str(uuid.uuid1())
    os.makedirs(f"responses/{request_id}", exist_ok=True)
    response_dir = f"responses/{request_id}"
    logger.info(f"Generating course for request ID: {request_id}")

    # Load or create course map
    course_map_path = "responses/1coursemaps.json"
    course_map: Dict[str, Any] = {}
    try:
        if os.path.exists(course_map_path):
            with open(course_map_path, 'r') as f:
                course_map = json.load(f)
        else:
            await save_result(course_map, course_map_path)
    except Exception as e:
        logger.error(f"Failed to load or create course map: {str(e)}")
        await websocket.send_json({"status": "error", "error": f"Failed to initialize course map: {str(e)}"})
        await websocket.close()
        return

    # Initialize progress map
    progress_map = {
        "course_outline": {"status": 0, "timestamp": None, "path": None, "error": None},
        "course_weeks": {"status": 0, "timestamp": None, "path": None, "error": None},
        "week_plans": {"status": 0, "timestamp": None, "path": None, "error": None},
        "course_milestone": {"status": 0, "timestamp": None, "path": None, "error": None}
    }

    # Save initial progress map and update course map
    try:
        progress_path = f"{response_dir}/progress.json"
        course_map[str(request_id)] = progress_map
        await save_result(progress_map, progress_path)
        await save_result(course_map, course_map_path)
    except Exception as e:
        logger.error(f"Failed to save initial progress map: {str(e)}")
        await websocket.send_json({"status": "error", "error": f"Failed to initialize progress: {str(e)}"})
        await websocket.close()
        return

    try:
        # Receive and validate input
        input_data = await websocket.receive_json()
        course_input = GenaiInput(**input_data)
        mapped_inputs = map_inputs(course_input)
        hours = get_difficulty_level(course_input.hours_per_week)

        user_instruction = (
            f"{INPUT_MAPPING['Topic']['prompt'].format(topic=mapped_inputs['topic'])}\n"
            f"{INPUT_MAPPING['Experience'][mapped_inputs['experience']]}\n"
            f"Total Weeks: {course_input.total_weeks}\n"
            f"{INPUT_MAPPING['Hours'][hours].format(hours=course_input.hours_per_week)}\n"
            f"{INPUT_MAPPING['LearningStyle'][mapped_inputs['learning_style']]}\n"
            f"{INPUT_MAPPING['Motivation'][mapped_inputs['motivation']].format(text=mapped_inputs['custom_motivation'])}"
        )

        result: Dict[str, Any] = {}
        service = GenaiService()

        # Step 1: Generate course outline
        logger.info("Starting course outline generation")
        await update_progress(websocket, request_id, "course_outline", 1, progress_map, course_map, response_dir)
        await asyncio.sleep(3)
        try:
            result['course_outline'] = await service.generate_course_outline(
                user_instruction=user_instruction,
                model_id=course_input.model_id,
                response_dir=response_dir
            )
            result_path = f"{response_dir}/course_outline.json"
            await save_result(result['course_outline'], result_path)
            await update_progress(websocket, request_id, "course_outline", 2, progress_map, course_map, response_dir, path=result_path)
            await asyncio.sleep(3)
        except Exception as e:
            await update_progress(websocket, request_id, "course_outline", 3, progress_map, course_map, response_dir, error=str(e))
            raise

        # Step 2: Generate weekly content
        logger.info("Starting weekly content generation")
        await update_progress(websocket, request_id, "course_weeks", 1, progress_map, course_map, response_dir)
        await asyncio.sleep(3)
        try:
            result['course_weeks'] = await service.generate_weekly_content(
                user_instruction=user_instruction,
                model_id=course_input.model_id,
                course_outline=result['course_outline'],
                response_dir=response_dir
            )
            result_path = f"{response_dir}/course_weeks.json"
            await save_result(result['course_weeks'], result_path)
            await update_progress(websocket, request_id, "course_weeks", 2, progress_map, course_map, response_dir, path=result_path)
            await asyncio.sleep(3)
        except Exception as e:
            await update_progress(websocket, request_id, "course_weeks", 3, progress_map, course_map, response_dir, error=str(e))
            raise

        # Step 3: Generate weekly plans
        logger.info("Starting weekly plans generation")
        await update_progress(websocket, request_id, "week_plans", 1, progress_map, course_map, response_dir)
        await asyncio.sleep(3)
        try:
            result['week_plans'] = await service.generate_weekly_plans(
                course_weeks=result['course_weeks'],
                response_dir=response_dir
            )
            result_path = f"{response_dir}/week_plans.json"
            await save_result(result['week_plans'], result_path)
            await update_progress(websocket, request_id, "week_plans", 2, progress_map, course_map, response_dir, path=result_path)
            await asyncio.sleep(3)
        except Exception as e:
            await update_progress(websocket, request_id, "week_plans", 3, progress_map, course_map, response_dir, error=str(e))
            raise

        # Step 4: Generate course milestone
        logger.info("Starting course milestone generation")
        await update_progress(websocket, request_id, "course_milestone", 1, progress_map, course_map, response_dir)
        await asyncio.sleep(3)
        try:
            result['course_milestone'] = await service.generate_course_milestone(
                user_instruction=user_instruction,
                model_id=course_input.model_id,
                week_plans=result['week_plans'],
                response_dir=response_dir
            )
            result_path = f"{response_dir}/course_milestone.json"
            await save_result(result['course_milestone'], result_path)
            await update_progress(websocket, request_id, "course_milestone", 2, progress_map, course_map, response_dir, path=result_path)
            await asyncio.sleep(3)
        except Exception as e:
            await update_progress(websocket, request_id, "course_milestone", 3, progress_map, course_map, response_dir, error=str(e))
            raise

        # Transform result
        transformed_result = await service.transform_result(result)
        
        transformed_result['user_requirement'] = {
            'experience' : mapped_inputs['experience'],
            'learning_style' : mapped_inputs['learning_style'],
            'motivation' : mapped_inputs['motivation'],
            'model': MODEL_MAP[mapped_inputs['model_id']]
        }

        # Save final progress map, course map, and transformed result
        logger.info("Course generation completed")
        progress_path = f"{response_dir}/progress.json"
        await save_result(progress_map, progress_path)
        await save_result(course_map, course_map_path)
        await save_result(transformed_result, f"{response_dir}/result.json")
        await websocket.send_json({"status": "completed", "request_id": request_id, "progress_path": progress_path})

    except WebSocketDisconnect:
        logger.info("WebSocket disconnected")
    except Exception as e:
        logger.error(f"Course creation failed: {str(e)}")
        await websocket.send_json({"status": "error", "error": str(e)})
    finally:
        await websocket.close()