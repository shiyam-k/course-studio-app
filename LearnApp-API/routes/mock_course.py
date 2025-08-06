import logging
import uuid
import os
import json
from datetime import datetime
from typing import Dict, Any
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
import asyncio

# Configure logging
logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

router = APIRouter(prefix="/mock-courses", tags=["courses"])

class ProgressUpdate(BaseModel):
    step: str
    status: int
    timestamp: str | None
    path: str | None
    error: str | None
    progress: int

async def save_result(data: Any, path: str):
    """Mock save_result function to write data to file."""
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w') as f:
        json.dump(data, f, indent=4)

async def update_progress(websocket: WebSocket, request_id: str, step: str, status: int, progress_map: Dict[str, Any], course_map: Dict[str, Any], response_dir: str, path: str = None, error: str = None):
    logger.info(f"Mock updating progress for step {step}: status={status}, path={path}, error={error}")
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
        logger.error(f"Failed to save mock progress map for step {step}: {str(e)}")
        raise

@router.websocket("/generate")
async def generate_course(websocket: WebSocket):
    logger.info("Mock generating course")
    await websocket.accept()
    request_id = str(uuid.uuid1())
    os.makedirs(f"responses/{request_id}", exist_ok=True)
    response_dir = f"responses/{request_id}"
    logger.info(f"Mock generating course for request ID: {request_id}")
    
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
        logger.error(f"Failed to load or create mock course map: {str(e)}")
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
        logger.error(f"Failed to save initial mock progress map: {str(e)}")
        await websocket.send_json({"status": "error", "error": f"Failed to initialize progress: {str(e)}"})
        await websocket.close()
        return
    
    try:
        # Receive input (but ignore actual processing)
        await websocket.receive_json()
        
        # Mock result data
        result = {
            "course_outline": {
                "Title": "Introduction to NLP",
                "Overview": "Learn the fundamentals of Natural Language Processing.",
                "Prerequisites": ["Basic Python", "Statistics"],
                "Duration": {"totalWeeks": "4 weeks"},
                "LearningOutcomes": ["Understand NLP concepts", "Build NLP models"],
                "Skills": ["Text processing", "Machine learning"]
            },
            "course_weeks": [
                {
                    "WeekNumber": 1,
                    "WeekTopic": "NLP Basics",
                    "HoursPerWeek": 5,
                    "WeekModules": [
                        {"module_number": 1.1, "module": "Tokenization", "duration_hrs": 2, "ModuleBlocks": [
                            {"BlockTitle": "Introduction to Tokenization", "Length": 1, "Type": "lecture"}
                        ], "BlockMetadata": [
                            {"ID": 1, "Objectives": ["Learn tokenization"], "References": ["NLTK documentation"]}
                        ]}
                    ]
                }
            ],
            "block_metadata": [[{"ID": 1, "Objectives": ["Learn tokenization"], "References": ["NLTK documentation"]}]],
            "week_plans": [{"WeekNumber": 1, "Plan": "Study tokenization"}],
            "weekly_milestones": [{"MilestoneTitle": "Week 1 Milestone", "Description": "Complete tokenization tasks", "Objectives": ["Master tokenization"], "Prerequisites": [], "Deliverables": ["Weekly assignment"], "UploadRequired": True, "SupportedFiletypes": ["pdf"], "References": []}],
            "course_milestone": {"MilestoneTitle": "Course Completion", "Description": "Build an NLP model", "Objectives": ["Master NLP"], "Prerequisites": ["Basic Python"], "Deliverables": ["Final project"], "UploadRequired": True, "SupportedFiletypes": ["py"], "References": []}
        }
        
        # Step 1: Mock course outline
        logger.info("Mock starting course outline generation")
        await update_progress(websocket, request_id, "course_outline", 1, progress_map, course_map, response_dir)
        await asyncio.sleep(10000)
        try:
            result_path = f"{response_dir}/course_outline.json"
            await save_result(result['course_outline'], result_path)
            await update_progress(websocket, request_id, "course_outline", 2, progress_map, course_map, response_dir, path=result_path)
            await asyncio.sleep(3)
        except Exception as e:
            await update_progress(websocket, request_id, "course_outline", 3, progress_map, course_map, response_dir, error=str(e))
            raise
        
        # Step 2: Mock weekly modules
        logger.info("Mock starting weekly modules generation")
        await update_progress(websocket, request_id, "course_weeks", 1, progress_map, course_map, response_dir)
        await asyncio.sleep(3)
        try:
            result_path = f"{response_dir}/course_weeks.json"
            await save_result(result['course_weeks'], result_path)
            await update_progress(websocket, request_id, "course_weeks", 2, progress_map, course_map, response_dir, path=result_path)
            await asyncio.sleep(3)
        except Exception as e:
            await update_progress(websocket, request_id, "course_weeks", 3, progress_map, course_map, response_dir, error=str(e))
            raise
        
        # Step 3: Mock module blocks
        logger.info("Mock starting module blocks generation")
        await update_progress(websocket, request_id, "module_blocks", 1, progress_map, course_map, response_dir)
        await asyncio.sleep(3)
        try:
            result_path = f"{response_dir}/module_blocks.json"
            await save_result(result['course_weeks'], result_path)
            await update_progress(websocket, request_id, "module_blocks", 2, progress_map, course_map, response_dir, path=result_path)
            await asyncio.sleep(3)
        except Exception as e:
            await update_progress(websocket, request_id, "module_blocks", 3, progress_map, course_map, response_dir, error=str(e))
            raise
        
        # Step 4: Mock block metadata
        logger.info("Mock starting block metadata generation")
        await update_progress(websocket, request_id, "block_metadata", 1, progress_map, course_map, response_dir)
        await asyncio.sleep(3)
        try:
            result_path = f"{response_dir}/block_metadata.json"
            await save_result(result['block_metadata'], result_path)
            await update_progress(websocket, request_id, "block_metadata", 2, progress_map, course_map, response_dir, path=result_path)
            await asyncio.sleep(3)
        except Exception as e:
            await update_progress(websocket, request_id, "block_metadata", 3, progress_map, course_map, response_dir, error=str(e))
            raise
        
        # Step 5: Mock weekly plans
        logger.info("Mock starting weekly plans generation")
        await update_progress(websocket, request_id, "week_plans", 1, progress_map, course_map, response_dir)
        await asyncio.sleep(3)
        try:
            result_path = f"{response_dir}/week_plans.json"
            await save_result(result['week_plans'], result_path)
            await update_progress(websocket, request_id, "week_plans", 2, progress_map, course_map, response_dir, path=result_path)
            await asyncio.sleep(3)
        except Exception as e:
            await update_progress(websocket, request_id, "week_plans", 3, progress_map, course_map, response_dir, error=str(e))
            raise
        
        # Step 6: Mock weekly milestones
        logger.info("Mock starting weekly milestones generation")
        await update_progress(websocket, request_id, "weekly_milestones", 1, progress_map, course_map, response_dir)
        await asyncio.sleep(3)
        try:
            result_path = f"{response_dir}/weekly_milestones.json"
            await save_result(result['weekly_milestones'], result_path)
            await update_progress(websocket, request_id, "weekly_milestones", 2, progress_map, course_map, response_dir, path=result_path)
            await asyncio.sleep(3)
        except Exception as e:
            await update_progress(websocket, request_id, "weekly_milestones", 3, progress_map, course_map, response_dir, error=str(e))
            raise
        
        # Step 7: Mock course milestone
        logger.info("Mock starting course milestone generation")
        await update_progress(websocket, request_id, "course_milestone", 1, progress_map, course_map, response_dir)
        await asyncio.sleep(3)
        try:
            result_path = f"{response_dir}/course_milestone.json"
            await save_result(result['course_milestone'], result_path)
            await update_progress(websocket, request_id, "course_milestone", 2, progress_map, course_map, response_dir, path=result_path)
            await asyncio.sleep(3)
        except Exception as e:
            await update_progress(websocket, request_id, "course_milestone", 3, progress_map, course_map, response_dir, error=str(e))
            raise
        
        # Mock transformed result in CourseSpecialization structure
        transformed_result = {
            "CourseSpecialization": {
                "Title": result['course_outline']['Title'],
                "Overview": result['course_outline']['Overview'],
                "Prerequisites": [
                    {"id": idx, "title": prereq, "length": 0, "type": "prerequisite", "Objectives": [], "references": []}
                    for idx, prereq in enumerate(result['course_outline']['Prerequisites'])
                ],
                "TotalWeeks": int(result['course_outline']['Duration']['totalWeeks'].split()[0]),
                "LearningOutcomes": result['course_outline']['LearningOutcomes'],
                "Skills": result['course_outline']['Skills'],
                "Weeks": [],
                "CourseMilestone": {
                    "title": result['course_milestone'].get('MilestoneTitle', "Course Completion Milestone"),
                    "description": result['course_milestone'].get('Description', "Complete the course and demonstrate mastery of NLP concepts."),
                    "objectives": result['course_milestone'].get('Objectives', result['course_outline']['LearningOutcomes']),
                    "prerequisites": result['course_milestone'].get('Prerequisites', result['course_outline']['Prerequisites']),
                    "deliverables": result['course_milestone'].get('Deliverables', ["Final project", "Course assessment"]),
                    "uploadrequired": result['course_milestone'].get('UploadRequired', True),
                    "supportedfiletypes": result['course_milestone'].get('SupportedFiletypes', ["pdf", "docx", "py"]),
                    "references": result['course_milestone'].get('References', [])
                }
            }
        }

        # Mock transform weeks
        block_metadata_index = 0
        for week_idx, week_module in enumerate(result['course_weeks']):
            week = {
                "WeekNumber": week_module['WeekNumber'],
                "WeekTopic": week_module['WeekTopic'],
                "WeekModules": [],
                "HoursPerWeek": week_module['HoursPerWeek'],
                "WeekMilestone": {
                    "title": result['weekly_milestones'][week_idx].get('MilestoneTitle', f"Week {week_module['WeekNumber']} Milestone"),
                    "description": result['weekly_milestones'][week_idx].get('Description', f"Complete key tasks for Week {week_module['WeekNumber']}."),
                    "objectives": result['weekly_milestones'][week_idx].get('Objectives', []),
                    "prerequisites": result['weekly_milestones'][week_idx].get('Prerequisites', []),
                    "deliverables": result['weekly_milestones'][week_idx].get('Deliverables', ["Weekly assignment"]),
                    "uploadrequired": result['weekly_milestones'][week_idx].get('UploadRequired', True),
                    "supportedfiletypes": result['weekly_milestones'][week_idx].get('SupportedFiletypes', ["pdf", "docx", "py"]),
                    "references": result['weekly_milestones'][week_idx].get('References', [])
                }
            }
            
            # Mock transform modules
            for module_idx, module in enumerate(week_module['WeekModules']):
                content_blocks = []
                if block_metadata_index < len(result['block_metadata']):
                    block_metadata = result['block_metadata'][block_metadata_index]
                    for block_idx, block in enumerate(module['ModuleBlocks']):
                        if block_idx < len(block_metadata):
                            block_meta = block_metadata[block_idx]
                            content_blocks.append({
                                "id": block_meta['ID'],
                                "title": block['BlockTitle'],
                                "length": block['Length'],
                                "type": block['Type'],
                                "Objectives": block_meta['Objectives'],
                                "references": block_meta['References']
                            })
                        else:
                            content_blocks.append({
                                "id": block_idx,
                                "title": block['BlockTitle'],
                                "length": block['Length'],
                                "type": block['Type'],
                                "Objectives": [],
                                "references": []
                            })
                
                week['WeekModules'].append({
                    "id": float(module['module_number']),
                    "title": module['module'],
                    "week": week_module['WeekNumber'],
                    "durationHours": module['duration_hrs'],
                    "ContentBlocks": content_blocks
                })
                
                block_metadata_index += 1
            
            transformed_result['CourseSpecialization']['Weeks'].append(week)
        
        # Save final mock progress map, course map, and transformed result
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