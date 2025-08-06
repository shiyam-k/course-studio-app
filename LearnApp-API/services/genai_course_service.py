import threading
from typing import Any, Dict, List, Optional
from fastapi import WebSocket
from pydantic import BaseModel
from datetime import datetime
from google import genai
from utils.genai import MODEL_MAP, create_cache, delete_cache, generate_content, logger, initialize_client, get_random_api_key
from prompts.online.course_outliner import COURSE_OUTLINE_SYSTEM, COURSE_OUTLINE_FORMAT
from prompts.online.week_generator import WEEK_SYSTEM, WEEK_FORMAT
from prompts.online.course_milestone import MILESTONE_SYSTEM, MILESTONE_FORMAT
from prompts.online.system import SYSTEM_INSTRUCTION
from models.course_models import CourseOutline, Week, Milestone
from models.course_creation import ProgressUpdate
from utils.genai import save_result, courseoutline_md, format_weekly_plan, generate_overall_plan
from config.config import API_KEYS

async def update_progress(
    websocket: WebSocket,
    request_id: str,
    step: str,
    status: int,
    progress_map: Dict[str, Any],
    course_map: Dict[str, Any],
    response_dir: str,
    path: Optional[str] = None,
    error: Optional[str] = None
) -> None:
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

def generate_week_content(
    client: genai.Client,
    model_id: int,
    week: str,
    cache_name: str,
    response_schema: Any,
    results: List[Any],
    index: int
) -> None:
    try:
        week_response = generate_content(
            client=client,
            model_id=model_id,
            contents=f"Generate a week's content for this course: {week}",
            cache_name=cache_name,
            response_schema=response_schema
        )
        results[index] = week_response
        logger.info(f"Generated content for week {index + 1}")
    except Exception as e:
        logger.error(f"Failed to generate content for week {index + 1}: {str(e)}")
        raise

async def generate_course_content(
    user_instruction: str,
    model_id,
    response_dir: str,
    progress_map: Dict[str, Any],
    course_map: Dict[str, Any],
    request_id: str,
    websocket: Any
) -> Dict[str, Any]:
    result = {}
    
    # Step 1: Generate course outline
    logger.info("Starting course outline generation")
    await update_progress(websocket, request_id, "course_outline", 1, progress_map, course_map, response_dir)
    outline_cache_name = None
    try:
        outline_client = initialize_client(API_KEYS)
        outline_cache_name = create_cache(
            client=outline_client,
            model_id=model_id,
            display_name="course_outline",
            system_instruction=(SYSTEM_INSTRUCTION, COURSE_OUTLINE_SYSTEM, COURSE_OUTLINE_FORMAT),
            contents=(user_instruction)
        )
        result['course_outline'] = generate_content(
            client=outline_client,
            model_id=model_id,
            contents=user_instruction,
            cache_name=outline_cache_name,
            response_schema=CourseOutline
        )
        result_path = f"{response_dir}/course_outline.json"
        result_md = courseoutline_md(result['course_outline'])
        await save_result(result['course_outline'], result_path)
        with open(f"{response_dir}/course_outline.md", 'w') as f:
            f.write(result_md)
        await update_progress(websocket, request_id, "course_outline", 2, progress_map, course_map, response_dir, path=result_path)
    except Exception as e:
        await update_progress(websocket, request_id, "course_outline", 3, progress_map, course_map, response_dir, error=str(e))
        raise
    finally:
        if outline_cache_name:
            delete_cache(outline_client, outline_cache_name)

    # Step 2: Generate weekly content
    logger.info("Starting weekly content generation")
    week_client = initialize_client(API_KEYS)
    await update_progress(websocket, request_id, "course_weeks", 1, progress_map, course_map, response_dir)
    week_cache_name = None
    try:
        week_cache_name = create_cache(
            client=week_client,
            model_id=model_id,
            display_name="weekly_content",
            system_instruction=(SYSTEM_INSTRUCTION, WEEK_SYSTEM, WEEK_FORMAT),
            contents=(user_instruction, result_md)
        )
        results = [None] * len(result['course_outline']['weeks'])
        threads = []
        
        for i, week in enumerate(result['course_outline']['weeks']):
            thread = threading.Thread(
                target=generate_week_content,
                args=(week_client, model_id, week, week_cache_name, Week, results, i)
            )
            threads.append(thread)
            thread.start()
        
        for thread in threads:
            thread.join()
        
        result['course_weeks'] = [r for r in results]
        result_path = f"{response_dir}/course_weeks.json"
        await save_result(result['course_weeks'], result_path)
        with open(f"{response_dir}/course_weeks.md", 'w') as f:
            for week_module in result['course_weeks']:
                f.write(format_weekly_plan(week_module, week_module['week_number'] - 1) + '\n')
        await update_progress(websocket, request_id, "course_weeks", 2, progress_map, course_map, response_dir, path=result_path)
    except Exception as e:
        await update_progress(websocket, request_id, "course_weeks", 3, progress_map, course_map, response_dir, error=str(e))
        raise
    finally:
        if week_cache_name:
            delete_cache(week_client, week_cache_name)

    # Step 3: Generate weekly plans
    logger.info("Starting weekly plans generation")
    await update_progress(websocket, request_id, "week_plans", 1, progress_map, course_map, response_dir)
    try:
        result['week_plans'] = [
            format_weekly_plan(week_module, i)
            for i, week_module in enumerate(result['course_weeks'])
        ]
        result_path = f"{response_dir}/week_plans.json"
        await save_result(result['week_plans'], result_path)
        await update_progress(websocket, request_id, "week_plans", 2, progress_map, course_map, response_dir, path=result_path)
    except Exception as e:
        await update_progress(websocket, request_id, "week_plans", 3, progress_map, course_map, response_dir, error=str(e))
        raise

    # Step 4: Generate course milestone
    logger.info("Starting course milestone generation")
    await update_progress(websocket, request_id, "course_milestone", 1, progress_map, course_map, response_dir)
    milestone_cache_name = None
    try:
        milestone_client = initialize_client(API_KEYS)
        overall_plan = generate_overall_plan(result['week_plans'])
        milestone_cache_name = create_cache(
            client=milestone_client,
            model_id=model_id,
            display_name="course_milestone",
            system_instruction=(SYSTEM_INSTRUCTION, MILESTONE_SYSTEM, MILESTONE_FORMAT),
            contents=(user_instruction, result_md)
        )
        result['course_milestone'] = generate_content(
            client=milestone_client,
            model_id=model_id,
            contents=overall_plan,
            cache_name=milestone_cache_name,
            response_schema=Milestone
        )
        result_path = f"{response_dir}/course_milestone.json"
        await save_result(result['course_milestone'], result_path)
        await update_progress(websocket, request_id, "course_milestone", 2, progress_map, course_map, response_dir, path=result_path)
    except Exception as e:
        await update_progress(websocket, request_id, "course_milestone", 3, progress_map, course_map, response_dir, error=str(e))
        raise
    finally:
        if milestone_cache_name:
            delete_cache(milestone_client, milestone_cache_name)

    return result

async def transform_result(result: Dict[str, Any]) -> Dict[str, Any]:
    transformed_result = {
        "course_outline": {
            "title": result['course_outline']['title'],
            "overview": result['course_outline']['overview'],
            "prerequisites": [
                {"block_title": prereq, "length": 0, "type": "prerequisite", "objectives": [], "references": []}
                for prereq in result['course_outline']['prerequisites']
            ],
            "total_weeks": int(result['course_outline']['total_weeks']),
            "learning_outcomes": result['course_outline']['learning_outcomes'],
            "skills": result['course_outline']['skills'],
            "weeks": [],
            "course_milestone": {
                "milestone_title": result['course_milestone'].get('MilestoneTitle', ""),
                "description": result['course_milestone'].get('Description', ""),
                "objectives": result['course_milestone'].get('Objectives', []),
                "prerequisites": result['course_milestone'].get('Prerequisites', []),
                "deliverables": result['course_milestone'].get('Deliverables', []),
                "upload_required": result['course_milestone'].get('UploadRequired', False),
                "supported_filetypes": result['course_milestone'].get('SupportedFiletypes', []),
                "references": result['course_milestone'].get('References', []),
                "length": result['course_milestone'].get('Length', ""),
                "type": result['course_milestone'].get('Type', "")
            }
        }
    }

    for week_idx, week_module in enumerate(result['course_weeks']):
        week = {
            "week_number": week_module['week_number'],
            "week_topic": week_module['week_topic'],
            "week_modules": [],
            "hours_per_week": week_module.get('HoursPerWeek', 0),
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
        
        for module in week_module['week_modules']:
            content_blocks = [
                {
                    "block_title": block['block_title'],
                    "length": block.get('length', 0),
                    "type": block.get('type', "Content"),
                    "objectives": [],
                    "references": []
                }
                for block in module.get('content_blocks', [])
            ]
            week['week_modules'].append({
                "module_title": module['module_title'],
                "duration_hours": module.get('duration_hours', 0),
                "content_blocks": content_blocks
            })
        
        transformed_result['course_outline']['weeks'].append(week)
    
    return transformed_result