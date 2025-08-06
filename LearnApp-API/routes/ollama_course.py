import logging
import uuid
import os
import json
from datetime import datetime
from typing import List, Dict, Any
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from utils.generators import format_weekly_plan, generate_block_title, generate_overall_plan
from models.course_creation import CourseInput
from pydantic import BaseModel
from services.ollama_course_service import CourseService
from utils.helper import map_inputs, save_result
import asyncio

# Configure logging
logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

router = APIRouter(prefix="/courses", tags=["courses"])

class ProgressUpdate(BaseModel):
    step: str
    status: int
    timestamp: str | None
    path: str | None
    error: str | None
    progress: int

async def update_progress(websocket: WebSocket, request_id: str, step: str, status: int, progress_map: Dict[str, Any], course_map: Dict[str, Any], response_dir: str, path: str = None, error: str = None):
    logger.info(f"Updating progress for step {step}: status={status}, path={path}, error={error}")
    progress_map[step].update({
        "status": status,
        "timestamp": datetime.utcnow().isoformat() + "Z" if status in [1, 2, 3] else None,
        "path": path,
        "error": error
    })
    total_steps = len(progress_map)
    completed_steps = sum(1 for s in progress_map.values() if s["status"] == 2)
    progress_percentage = int((completed_steps / total_steps) * 100) if status == 2 else int(((completed_steps + 0.5) / total_steps) * 100)
    
    update = ProgressUpdate(
        step=step,
        status=status,
        timestamp=progress_map[step]["timestamp"],
        path=path,
        error=error,
        progress=progress_percentage
    )
    await websocket.send_json(update.dict())
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
    course_map = {}
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
        "module_blocks": {"status": 0, "timestamp": None, "path": None, "error": None},
        "block_metadata": {"status": 0, "timestamp": None, "path": None, "error": None},
        "week_plans": {"status": 0, "timestamp": None, "path": None, "error": None},
        "weekly_milestones": {"status": 0, "timestamp": None, "path": None, "error": None},
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
        course_input = CourseInput(**input_data)
        mapped_inputs = map_inputs(course_input)
        
        result = {}
        
        service = CourseService()
        
        # Step 1: Generate course outline
        logger.info("Starting course outline generation")
        await update_progress(websocket, request_id, "course_outline", 1, progress_map, course_map, response_dir)
        await asyncio.sleep(3)
        try:
            result_path = f"{response_dir}/course_outline.json"
            result['course_outline'] = await service.generate_course_outline(mapped_inputs, f"{response_dir}/course_outline.md")
            await save_result(result['course_outline'], result_path)
            await update_progress(websocket, request_id, "course_outline", 2, progress_map, course_map, response_dir, path=result_path)
            await asyncio.sleep(3)
        except Exception as e:
            await update_progress(websocket, request_id, "course_outline", 3, progress_map, course_map, response_dir, error=str(e))
            raise
        
        # Step 2: Generate weekly modules
        logger.info("Starting weekly modules generation")
        await update_progress(websocket, request_id, "course_weeks", 1, progress_map, course_map, response_dir)
        await asyncio.sleep(3)
        try:
            result['course_weeks'] = await service.generate_weekly_modules(result['course_outline'], mapped_inputs['motivation'], mapped_inputs['custom_motivation'], mapped_inputs['experience'], f"{response_dir}/course_weeks.md")
            result_path = f"{response_dir}/course_weeks.json"
            await save_result(result['course_weeks'], result_path)
            await update_progress(websocket, request_id, "course_weeks", 2, progress_map, course_map, response_dir, path=result_path)
            await asyncio.sleep(3)
        except Exception as e:
            await update_progress(websocket, request_id, "course_weeks", 3, progress_map, course_map, response_dir, error=str(e))
            raise
        
        # Step 3: Generate module blocks concurrently
        logger.info("Starting module blocks generation")
        await update_progress(websocket, request_id, "module_blocks", 1, progress_map, course_map, response_dir)
        await asyncio.sleep(3)
        try:
            tasks = []
            for week_module in result['course_weeks']:
                for idx, module in enumerate(week_module['WeekModules']):
                    task = asyncio.create_task(
                        service.generate_module_blocks(
                            result['course_outline'],
                            week_module['WeekNumber'],
                            week_module['WeekTopic'],
                            week_module['WeekModules'],
                            idx,
                            mapped_inputs['motivation'],
                            mapped_inputs['custom_motivation'],
                            f"{response_dir}/module_blocks_{week_module['WeekNumber']}_{idx}.md"
                        )
                    )
                    tasks.append((task, week_module['WeekNumber'], idx))
            
            for task, week_number, module_idx in tasks:
                try:
                    blocks = await task
                    for week_module in result['course_weeks']:
                        if week_module['WeekNumber'] == week_number:
                            week_module['WeekModules'][module_idx]['ModuleBlocks'] = blocks
                except Exception as e:
                    logger.error(f"Error processing blocks for week {week_number}, module {module_idx}: {str(e)}")
                    await update_progress(websocket, request_id, "module_blocks", 3, progress_map, course_map, response_dir, error=str(e))
                    raise
            result_path = f"{response_dir}/module_blocks.json"
            await save_result(result['course_weeks'], result_path)
            await update_progress(websocket, request_id, "module_blocks", 2, progress_map, course_map, response_dir, path=result_path)
            await asyncio.sleep(3)
        except Exception as e:
            await update_progress(websocket, request_id, "module_blocks", 3, progress_map, course_map, response_dir, error=str(e))
            raise
        
        # Step 4: Generate block metadata concurrently
        logger.info("Starting block metadata generation")
        await update_progress(websocket, request_id, "block_metadata", 1, progress_map, course_map, response_dir)
        await asyncio.sleep(3)
        try:
            result['block_metadata'] = []
            tasks = []
            for week_module in result['course_weeks']:
                for idx, module in enumerate(week_module.get('WeekModules', [])):
                    task = asyncio.create_task(
                        service.generate_block_metadata(
                            week_module,
                            idx,
                            generate_block_title(week_module, idx),
                            mapped_inputs['motivation'],
                            mapped_inputs['custom_motivation'],
                            response_dir
                        )
                    )
                    tasks.append((task, week_module['WeekNumber'], idx))
            
            for task, week_number, module_idx in tasks:
                try:
                    metadata = await task
                    for week_module in result['course_weeks']:
                        if week_module['WeekNumber'] == week_number:
                            week_module['WeekModules'][module_idx]['BlockMetadata'] = metadata
                            result['block_metadata'].append(metadata)
                except Exception as e:
                    logger.error(f"Error processing metadata for week {week_number}, module {module_idx}: {str(e)}")
                    await update_progress(websocket, request_id, "block_metadata", 3, progress_map, course_map, response_dir, error=str(e))
                    raise
            result_path = f"{response_dir}/block_metadata.json"
            await save_result(result['block_metadata'], result_path)
            await update_progress(websocket, request_id, "block_metadata", 2, progress_map, course_map, response_dir, path=result_path)
            await asyncio.sleep(3)
        except Exception as e:
            await update_progress(websocket, request_id, "block_metadata", 3, progress_map, course_map, response_dir, error=str(e))
            raise
        
        # Step 5: Generate weekly plans
        logger.info("Starting weekly plans generation")
        await update_progress(websocket, request_id, "week_plans", 1, progress_map, course_map, response_dir)
        await asyncio.sleep(3)
        try:
            result['week_plans'] = [format_weekly_plan(week_module) for week_module in result['course_weeks']]
            result_path = f"{response_dir}/week_plans.json"
            await save_result(result['week_plans'], result_path)
            await update_progress(websocket, request_id, "week_plans", 2, progress_map, course_map, response_dir, path=result_path)
            await asyncio.sleep(3)
        except Exception as e:
            await update_progress(websocket, request_id, "week_plans", 3, progress_map, course_map, response_dir, error=str(e))
            raise
        
        # Step 6: Generate weekly milestones concurrently
        logger.info("Starting weekly milestones generation")
        await update_progress(websocket, request_id, "weekly_milestones", 1, progress_map, course_map, response_dir)
        await asyncio.sleep(3)
        try:
            result['weekly_milestones'] = [None] * len(result['week_plans'])
            tasks = []
            for week_number, plan in enumerate(result['week_plans']):
                task = asyncio.create_task(
                    service.generate_weekly_milestone(
                        plan,
                        experience=mapped_inputs['experience'],
                        motivation=mapped_inputs['motivation'],
                        result_path=response_dir,
                        week_number=week_number
                    )
                )
                tasks.append((task, week_number))
            
            for task, week_number in tasks:
                try:
                    milestone = await task
                    result['weekly_milestones'][week_number] = milestone
                except Exception as e:
                    logger.error(f"Error processing milestone for week {week_number + 1}: {str(e)}")
                    await update_progress(websocket, request_id, "weekly_milestones", 3, progress_map, course_map, response_dir, error=str(e))
                    raise
            result_path = f"{response_dir}/weekly_milestones.json"
            await save_result(result['weekly_milestones'], result_path)
            await update_progress(websocket, request_id, "weekly_milestones", 2, progress_map, course_map, response_dir, path=result_path)
            await asyncio.sleep(3)
        except Exception as e:
            await update_progress(websocket, request_id, "weekly_milestones", 3, progress_map, course_map, response_dir, error=str(e))
            raise
        
        # Step 7: Generate course milestone
        logger.info("Starting course milestone generation")
        await update_progress(websocket, request_id, "course_milestone", 1, progress_map, course_map, response_dir)
        await asyncio.sleep(3)
        try:
            overall_plan = generate_overall_plan(result['week_plans'])
            result['course_milestone'] = await service.generate_course_milestone(overall_plan, mapped_inputs['experience'], mapped_inputs['motivation'], response_dir)
            result_path = f"{response_dir}/course_milestone.json"
            await save_result(result['course_milestone'], result_path)
            await update_progress(websocket, request_id, "course_milestone", 2, progress_map, course_map, response_dir, path=result_path)
            await asyncio.sleep(3)
        except Exception as e:
            await update_progress(websocket, request_id, "course_milestone", 3, progress_map, course_map, response_dir, error=str(e))
            raise
        
        transformed_result = {
            "course_outline": {
                "title": result['course_outline']['Title'],
                "overview": result['course_outline']['Overview'],
                "prerequisites": [
                    {"block_title": prereq, "length": 0, "type": "prerequisite", "objectives": [], "references": []}
                    for prereq in result['course_outline']['Prerequisites']
                ],
                "total_weeks": int(result['course_outline']['Duration']['totalWeeks'].split()[0]),
                "learning_outcomes": result['course_outline']['LearningOutcomes'],
                "skills": result['course_outline']['Skills'],
                "weeks": [],
                "course_milestone": {
                    "milestone_title": result['course_milestone'].get('MilestoneTitle', "Course Completion Milestone"),
                    "description": result['course_milestone'].get('Description', "Complete the course and demonstrate mastery of NLP concepts."),
                    "objectives": result['course_milestone'].get('Objectives', result['course_outline']['LearningOutcomes']),
                    "prerequisites": result['course_milestone'].get('Prerequisites', result['course_outline']['Prerequisites']),
                    "deliverables": result['course_milestone'].get('Deliverables', ["Final project", "Course assessment"]),
                    "upload_required": result['course_milestone'].get('UploadRequired', True),
                    "supported_filetypes": result['course_milestone'].get('SupportedFiletypes', ["pdf", "docx", "py"]),
                    "references": result['course_milestone'].get('References', []),
                    "length": result['course_milestone'].get('Length', "Varies"),
                    "type": result['course_milestone'].get('Type', "Capstone")
                }
            }
        }

        # Transform weeks
        block_metadata_index = 0  # Track the current block_metadata sublist
        for week_idx, week_module in enumerate(result['course_weeks']):
            week = {
                "week_number": week_module['WeekNumber'],
                "week_topic": week_module['WeekTopic'],
                "week_modules": [],
                "hours_per_week": week_module['HoursPerWeek'],
                "week_milestone": {
                    "milestone_title": result['weekly_milestones'][week_idx].get('MilestoneTitle', f"Week {week_module['WeekNumber']} Milestone"),
                    "description": result['weekly_milestones'][week_idx].get('Description', f"Complete key tasks for Week {week_module['WeekNumber']}."),
                    "objectives": result['weekly_milestones'][week_idx].get('Objectives', []),
                    "prerequisites": result['weekly_milestones'][week_idx].get('Prerequisites', []),
                    "deliverables": result['weekly_milestones'][week_idx].get('Deliverables', ["Weekly assignment"]),
                    "upload_required": result['weekly_milestones'][week_idx].get('UploadRequired', True),
                    "supported_filetypes": result['weekly_milestones'][week_idx].get('SupportedFiletypes', ["pdf", "docx", "py"]),
                    "references": result['weekly_milestones'][week_idx].get('References', []),
                    "length": result['weekly_milestones'][week_idx].get('Length', "Varies"),
                    "type": result['weekly_milestones'][week_idx].get('Type', "Weekly Assessment")
                }
            }
            
            # Transform modules
            for module_idx, module in enumerate(week_module['WeekModules']):
                content_blocks = []
                # Use block_metadata from result['block_metadata'] for the current module
                if block_metadata_index < len(result['block_metadata']):
                    block_metadata = result['block_metadata'][block_metadata_index]
                    for block_idx, block in enumerate(module['ModuleBlocks']):
                        if block_idx < len(block_metadata):
                            block_meta = block_metadata[block_idx]
                            content_blocks.append({
                                "block_title": block['BlockTitle'],
                                "length": block['Length'],
                                "type": block['Type'],
                                "objectives": block_meta['Objectives'],
                                "references": [
                                    {"title": ref["title"], "source": ref["source"]}
                                    for ref in block_meta['References']
                                ],
                                "completed": False
                            })
                        else:
                            # Fallback if metadata is missing
                            content_blocks.append({
                                "block_title": block['BlockTitle'],
                                "length": block['Length'],
                                "type": block['Type'],
                                "objectives": [],
                                "references": []
                            })
                
                week['week_modules'].append({
                    "module_title": module['module'],
                    "duration_hours": module['duration_hrs'],
                    "content_blocks": content_blocks
                })
                
                # Increment block_metadata_index after processing each module
                block_metadata_index += 1
            
            transformed_result['course_outline']['weeks'].append(week)
        
        transformed_result['user_requirement'] = {
            'experience' : mapped_inputs['experience'],
            'learning_style' : mapped_inputs['learning_style'],
            'motivation' : mapped_inputs['motivation'],
            "model" : "gemma"
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