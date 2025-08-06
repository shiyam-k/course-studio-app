import os
import json
import uuid
from typing import Dict, Any
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from prompts.PROMPTS import INPUT_MAPPING
from pydantic import BaseModel
from datetime import datetime
import asyncio
import logging
from utils.helper import map_inputs, get_difficulty_level
from models.course_creation import GenaiInput, ProgressUpdate

# Configure logging
logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

router = APIRouter(prefix="/mock-genai-courses", tags=["mock-courses"])

async def save_result(data: Any, path: str) -> None:
    try:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, 'w') as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        logger.error(f"Failed to save result to {path}: {str(e)}")
        raise

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
    logger.info(f"Generating mock course for request ID: {request_id}")

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

        # Mock course outline
        logger.info("Starting mock course outline generation")
        await update_progress(websocket, request_id, "course_outline", 1, progress_map, course_map, response_dir)
        await asyncio.sleep(2)
        try:
            result['course_outline'] = {
                "title": f"Mock Course: {mapped_inputs['topic']}",
                "overview": "This is a mock course overview.",
                "prerequisites": ["Basic knowledge"],
                "total_weeks": course_input.total_weeks,
                "learning_outcomes": ["Understand core concepts"],
                "skills": ["Basic skills"],
                "weeks": [{"week_number": i + 1, "week_topic": f"Week {i + 1} Topic"} for i in range(course_input.total_weeks)]
            }
            result_path = f"{response_dir}/course_outline.json"
            await save_result(result['course_outline'], result_path)
            with open(f"{response_dir}/course_outline.md", 'w') as f:
                f.write(f"# Mock Course Outline\n\n## Title: {mapped_inputs['topic']}\n## Overview: This is a mock course overview.")
            await update_progress(websocket, request_id, "course_outline", 2, progress_map, course_map, response_dir, path=result_path)
            await asyncio.sleep(2)
        except Exception as e:
            await update_progress(websocket, request_id, "course_outline", 3, progress_map, course_map, response_dir, error=str(e))
            raise

        # Mock weekly content
        logger.info("Starting mock weekly content generation")
        await update_progress(websocket, request_id, "course_weeks", 1, progress_map, course_map, response_dir)
        await asyncio.sleep(2)
        try:
            result['course_weeks'] = [
                {
                    "week_number": i + 1,
                    "week_topic": f"Week {i + 1}: {mapped_inputs['topic']}",
                    "week_modules": [{"module_title": f"Module {j + 1}", "duration_hours": course_input.hours_per_week, "content_blocks": [{"block_title": "Mock Block", "length": 1, "type": "Content"}]} for j in range(2)],
                    "HoursPerWeek": course_input.hours_per_week
                } for i in range(course_input.total_weeks)
            ]
            result_path = f"{response_dir}/course_weeks.json"
            await save_result(result['course_weeks'], result_path)
            with open(f"{response_dir}/course_weeks.md", 'w') as f:
                for week in result['course_weeks']:
                    f.write(f"## Week {week['week_number']}\nTopic: {week['week_topic']}\n")
            await update_progress(websocket, request_id, "course_weeks", 2, progress_map, course_map, response_dir, path=result_path)
            await asyncio.sleep(2)
        except Exception as e:
            await update_progress(websocket, request_id, "course_weeks", 3, progress_map, course_map, response_dir, error=str(e))
            raise

        # Mock weekly plans
        logger.info("Starting mock weekly plans generation")
        await update_progress(websocket, request_id, "week_plans", 1, progress_map, course_map, response_dir)
        await asyncio.sleep(2)
        try:
            result['week_plans'] = [f"Mock plan for week {i + 1}" for i in range(course_input.total_weeks)]
            result_path = f"{response_dir}/week_plans.json"
            await save_result(result['week_plans'], result_path)
            await update_progress(websocket, request_id, "week_plans", 2, progress_map, course_map, response_dir, path=result_path)
            await asyncio.sleep(2)
        except Exception as e:
            await update_progress(websocket, request_id, "week_plans", 3, progress_map, course_map, response_dir, error=str(e))
            raise

        # Mock course milestone
        logger.info("Starting mock course milestone generation")
        await update_progress(websocket, request_id, "course_milestone", 1, progress_map, course_map, response_dir)
        await asyncio.sleep(2)
        try:
            result['course_milestone'] = {
                "MilestoneTitle": "Mock Course Completion",
                "Description": "Complete the mock course.",
                "Objectives": ["Demonstrate understanding"],
                "Prerequisites": ["None"],
                "Deliverables": ["Mock project"],
                "UploadRequired": True,
                "SupportedFiletypes": ["pdf"],
                "References": [],
                "Length": "Varies",
                "Type": "Capstone"
            }
            result_path = f"{response_dir}/course_milestone.json"
            await save_result(result['course_milestone'], result_path)
            await update_progress(websocket, request_id, "course_milestone", 2, progress_map, course_map, response_dir, path=result_path)
            await asyncio.sleep(2)
        except Exception as e:
            await update_progress(websocket, request_id, "course_milestone", 3, progress_map, course_map, response_dir, error=str(e))
            raise

        # Transform result
        transformed_result = {
            "course_outline": {
                "title": result['course_outline']['title'],
                "overview": result['course_outline']['overview'],
                "prerequisites": [
                    {"block_title": prereq, "length": 0, "type": "prerequisite", "objectives": [], "references": []}
                    for prereq in result['course_outline']['prerequisites']
                ],
                "total_weeks": result['course_outline']['total_weeks'],
                "learning_outcomes": result['course_outline']['learning_outcomes'],
                "skills": result['course_outline']['skills'],
                "weeks": [],
                "course_milestone": {
                    "milestone_title": result['course_milestone']['MilestoneTitle'],
                    "description": result['course_milestone']['Description'],
                    "objectives": result['course_milestone']['Objectives'],
                    "prerequisites": result['course_milestone']['Prerequisites'],
                    "deliverables": result['course_milestone']['Deliverables'],
                    "upload_required": result['course_milestone']['UploadRequired'],
                    "supported_filetypes": result['course_milestone']['SupportedFiletypes'],
                    "references": result['course_milestone']['References'],
                    "length": result['course_milestone']['Length'],
                    "type": result['course_milestone']['Type']
                }
            }
        }

        for week_idx, week_module in enumerate(result['course_weeks']):
            week = {
                "week_number": week_module['week_number'],
                "week_topic": week_module['week_topic'],
                "week_modules": [
                    {
                        "module_title": module['module_title'],
                        "duration_hours": module['duration_hours'],
                        "content_blocks": [
                            {
                                "block_title": block['block_title'],
                                "length": block['length'],
                                "type": block['type'],
                                "objectives": [],
                                "references": []
                            } for block in module['content_blocks']
                        ]
                    } for module in week_module['week_modules']
                ],
                "hours_per_week": week_module['HoursPerWeek'],
                "week_milestone": {
                    "milestone_title": f"Week {week_module['week_number']} Milestone",
                    "description": f"Complete key tasks for Week {week_module['week_number']}.",
                    "objectives": [],
                    "prerequisites": [],
                    "deliverables": ["Weekly assignment"],
                    "upload_required": True,
                    "supported_filetypes": ["pdf", "docx", "py"],
                    "references": [],
                    "length": "Varies",
                    "type": "Weekly Assessment"
                }
            }
            transformed_result['course_outline']['weeks'].append(week)

        # Save final progress map, course map, and transformed result
        logger.info("Mock course generation completed")
        progress_path = f"{response_dir}/progress.json"
        await save_result(progress_map, progress_path)
        await save_result(course_map, course_map_path)
        await save_result(transformed_result, f"{response_dir}/result.json")
        await websocket.send_json({"status": "completed", "request_id": request_id, "progress_path": progress_path})

    except WebSocketDisconnect:
        logger.info("WebSocket disconnected")
    except Exception as e:
        logger.error(f"Mock course creation failed: {str(e)}")
        await websocket.send_json({"status": "error", "error": str(e)})
    finally:
        await websocket.close()