from fastapi import APIRouter, HTTPException
import json
import os
from typing import List, Dict
from pydantic import BaseModel
from models.studio_models import CourseSummary
import time
from google import genai
from config.config import API_KEYS
from prompts.tutor_prompt import TUTOR_SYSTEM
from ollama import Client as OllamaClient
import random
from datetime import datetime


router = APIRouter(prefix='/studio', tags=['studio'])

class CourseResponse(BaseModel):
    weeks: List[Dict]
    course_milestone: Dict
    course_id: str
    
class BlockUpdateRequest(BaseModel):
    course_id: str
    week_name: str
    module_name: str
    block_name: str
    update: bool
    
class BlockAccessRequest(BaseModel):
    course_id: str
    week_name: str
    module_name: str
    block_name: str

@router.get("/courses", response_model=List[CourseSummary])
async def get_course_summaries():
    responses_dir = "responses"
    summaries = []

    if not os.path.exists(responses_dir):
        raise HTTPException(status_code=404, detail="Responses directory not found.")

    course_keys = [
        name for name in os.listdir(responses_dir)
        if os.path.isdir(os.path.join(responses_dir, name))
    ]
    print(course_keys)
    
    summaries = []
    
    for course_id in course_keys:
        result_path = f"responses/{course_id}/result.json"
        
        if os.path.exists(result_path):
            print("EXISTS")
            try:
                with open(result_path, "r") as f:
                    course_data = json.load(f)
                    
                total_blocks = 0
                completed_blocks = 0
                course_outline = course_data['course_outline']
                for week in course_outline.get("weeks", []):
                    for module in week.get("week_modules", []):
                        for block in module.get("content_blocks", []):
                            total_blocks += 1
                            if block.get("completed", False):
                                completed_blocks += 1

                course_progress = round((completed_blocks / total_blocks) * 100, 2) if total_blocks > 0 else 0.0
                print(completed_blocks, total_blocks)

                
                course_outline = course_data.get("course_outline", {})
                
                summary = CourseSummary(
                    course_id=course_id,
                    title=course_outline.get("title", ""),
                    overview=course_outline.get("overview", ""),
                    total_weeks=course_outline.get("total_weeks", 0),
                    skills=course_outline.get("skills", []),
                    course_progress=course_progress
                )
                summaries.append(summary)
            except Exception:
                continue
    
    return summaries

@router.get("/course/{folder_id}", response_model=CourseResponse)
async def get_course_data(folder_id: str):
    file_path = f"responses/{folder_id}/result.json"
    print(folder_id)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Folder or result.json not found")
    
    try:
        with open(file_path, 'r') as file:
            data = json.load(file)
        
        course_data = data.get("course_outline", {})
        weeks_response = []
        
        for week in course_data.get("weeks", []):
            week_data = {
                "week_topic": week.get("week_topic", ""),
                "week_hours": week.get("hours_per_week", 0),
                "modules": [
                    {
                        "module_name": module.get("module_title", ""),
                        "module_hours": module.get("duration_hours", 0),
                        "blocks": [
                            {
                                "block_name": block.get("block_title", ""),
                                "block_minutes": block.get("length", 0),
                                "completed": block.get("completed", False)
                            } for block in module.get("content_blocks", [])
                        ]
                    } for module in week.get("week_modules", [])
                ],
                "week_milestone": {
                    "milestone_name": week.get("week_milestone", {}).get("milestone_title", ""),
                    "milestone_minutes": week.get("week_milestone", {}).get("length", "0")
                }
            }
            weeks_response.append(week_data)
        
        course_milestone = {
            "milestone_name": course_data.get("course_milestone", {}).get("milestone_title", ""),
            "milestone_minutes": course_data.get("course_milestone", {}).get("length", "0")
        }
        
        return {
            "weeks": weeks_response,
            "course_milestone": course_milestone,
            "course_id": folder_id
        }
    
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON format in result.json")
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")
    
@router.put('/update-blocks')
async def update_blocks(payload: BlockUpdateRequest):
    try:
        file_path = f"responses/{payload.course_id}/result.json"

        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Folder or result.json not found")

        with open(file_path, 'r') as file:
            data = json.load(file)

        # Locate the week
        week = next((w for w in data['course_outline']['weeks'] if w['week_topic'] == payload.week_name), None)
        if not week:
            raise HTTPException(status_code=404, detail=f"Week '{payload.week_name}' not found.")

        # Locate the module
        module = next((m for m in week['week_modules'] if m['module_title'] == payload.module_name), None)
        if not module:
            raise HTTPException(status_code=404, detail=f"Module '{payload.module_name}' not found.")

        # Locate the block
        block = next((b for b in module['content_blocks'] if b['block_title'] == payload.block_name), None)
        if not block:
            raise HTTPException(status_code=404, detail=f"Block '{payload.block_name}' not found.")

        # Update block status
        block['completed'] = payload.update

        # Save back to file
        with open(file_path, 'w') as file:
            json.dump(data, file, indent=4)

        return {"message": "Block status updated successfully."}

    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")
    

@router.patch('/get-block-details')
async def get_block_details(payload: BlockAccessRequest):
    try:
        file_path = f"responses/{payload.course_id}/result.json"

        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Folder or result.json not found")

        with open(file_path, 'r') as file:
            data = json.load(file)

        # Locate the week
        week = next((w for w in data['course_outline']['weeks'] if w['week_topic'] == payload.week_name), None)
        if not week:
            raise HTTPException(status_code=404, detail=f"Week '{payload.week_name}' not found.")

        # Locate the module
        module = next((m for m in week['week_modules'] if m['module_title'] == payload.module_name), None)
        if not module:
            raise HTTPException(status_code=404, detail=f"Module '{payload.module_name}' not found.")

        # Locate the block
        block = next((b for b in module['content_blocks'] if b['block_title'] == payload.block_name), None)
        if not block:
            raise HTTPException(status_code=404, detail=f"Block '{payload.block_name}' not found.")

        objectives = block.get("objectives", [])
        chat = block.get("chat", [])

        return {
            "objectives": objectives if isinstance(objectives, list) else [],
            "chat": chat if isinstance(chat, list) else []
        }

    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=f"Error retrieving block data: {str(e)}")

class ChatModel(BaseModel):
    query: str
    model_type: int
    model: str
    course_id: str
    week_name: str
    module_name: str
    block_name: str


@router.put('/chat-tutor')
async def chat_router(chat: ChatModel):
    try:
        file_path = f"responses/{chat.course_id}/result.json"

        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Course result file not found.")

        with open(file_path, 'r') as f:
            data = json.load(f)

        # Locate the week/module/block
        week = next((w for w in data['course_outline']['weeks'] if w['week_topic'] == chat.week_name), None)
        if not week:
            raise HTTPException(status_code=404, detail=f"Week '{chat.week_name}' not found.")
        module = next((m for m in week['week_modules'] if m['module_title'] == chat.module_name), None)
        if not module:
            raise HTTPException(status_code=404, detail=f"Module '{chat.module_name}' not found.")
        block = next((b for b in module['content_blocks'] if b['block_title'] == chat.block_name), None)
        if not block:
            raise HTTPException(status_code=404, detail=f"Block '{chat.block_name}' not found.")

        # Initialize chat history if absent
        if "chat" not in block or not isinstance(block["chat"], list):
            block["chat"] = []

        chat_history = block["chat"]
        start_time_iso = datetime.utcnow().isoformat()

        if chat.model_type == 0:
            model_name = chat.model
            client = genai.Client(api_key=random.choice(API_KEYS))
            
            content = f"""
                    Course Title: {data['course_outline']['title']}
                    Course Week: {chat.week_name}
                    Current Module: {chat.module_name}
                    Current Topic: {chat.block_name}
                    Topic's Objectives: {block.get('objectives', [])}
                """

            # Include up to 3 past user-AI pairs (6 messages max)
            past_pairs = [msg for msg in chat_history[-3:]]
            chat_context = ""
            for msg in past_pairs:
                for part in msg:
                    chat_context += f"ROLE : {part['role']}\n"
                    chat_context += f"Message : {part['message']}\n"

            start_time = time.time()
            response = client.models.generate_content(
                model=model_name,
                contents=content + "\n" + chat_context + "\n" + chat.query,
                config=genai.types.GenerateContentConfig(systemInstruction=TUTOR_SYSTEM)
            )
            elapsed = round(time.time() - start_time, 2)
            reply = response.candidates[0].content.parts[0].text

        elif chat.model_type == 1:
            client = OllamaClient(host='http://127.0.0.1:11434')
            start_time = time.time()
            response = client.chat(
                model=chat.model,
                messages=[
                    {"role": "user", "content": chat.query},
                    {"role": "system", "content": TUTOR_SYSTEM},
                ],
                options={"temperature": 0.5}
            )
            elapsed = round(time.time() - start_time, 2)
            reply = response['message']['content']

        else:
            raise HTTPException(status_code=400, detail="Invalid model selected.")

        chat_entry = [
            [{
                "role": "user",
                "message": chat.query,
                "model": chat.model,
                "response_time": elapsed,
                "start_time": start_time_iso
            },
            {
                "role": "AI",
                "message": reply,
                "model": chat.model,
                "response_time": elapsed,
                "start_time": start_time_iso
            }]
        ]

        block["chat"].extend(chat_entry)

        # Save updated file
        with open(file_path, 'w') as f:
            json.dump(data, f, indent=4)

        return {
            "response": reply,
            "model": chat.model,
            "response_time": elapsed,
            "start_time": start_time_iso
        }

    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=f"Chat tutor failed: {str(e)}")


from utils.helper import convert_json_to_markdown
from fastapi.responses import PlainTextResponse
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from markdown_pdf import MarkdownPdf, Section
import logging

logger = logging.getLogger(__name__)

@router.post("/convert", response_class=FileResponse)
async def convert_course_outline(course_id: str):
    """
    Convert a JSON course outline to Markdown and then to PDF.
    
    Args:
        course_id: The identifier for the course, used to locate the JSON file.
    
    Returns:
        FileResponse with the generated PDF file.
    
    Raises:
        HTTPException: If the JSON file is not found or conversion fails.
    """
    try:
        # Step 1: Construct path and validate
        file_path = f"responses/{course_id}/result.json"

        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail=f"Result file not found for course_id: {course_id}")

        # Step 2: Load JSON data
        with open(file_path, 'r') as file:
            course_data = json.load(file)

        # Step 3: Convert JSON to Markdown
        markdown_content = convert_json_to_markdown(course_data)
        logger.info("Successfully converted JSON to Markdown")

        # Step 4: Convert Markdown to PDF
        pdf = MarkdownPdf(toc_level=3, optimize=True)
        pdf.meta["title"] = course_data["course_outline"]["title"]
        pdf.meta["author"] = "Course Converter API"
        
        # Add Markdown content as a single section
        pdf.add_section(Section(markdown_content, toc=True))
        
        # Save PDF to temporary file
        output_path = f"temp_{course_id}_outline.pdf"
        pdf.save(output_path)
        logger.info(f"PDF generated at {output_path}")

        # Return the PDF file
        return FileResponse(
            path=output_path,
            filename=f"{course_id}_outline.pdf",
            media_type="application/pdf"
        )
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON format: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid JSON format")
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
    
    
    