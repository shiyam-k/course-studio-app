import os
import json
import random
import logging
import uuid
from typing import Any, Dict, List, Optional
from datetime import datetime
from google import genai
from google.genai import types

# Configure logging
logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

def courseoutline_md(course_dict: Dict[str, Any]) -> str:
    try:
        md_string = f'# {course_dict["title"]}\n\n'
        md_string += f'**Overview:** {course_dict["overview"]}\n\n'
        md_string += '---\n\n'
        md_string += '## Course Details\n\n'
        md_string += f'**Total Weeks:** {course_dict["total_weeks"]}\n\n'

        md_string += '### Weeks\n'
        for week in course_dict["weeks"]:
            md_string += f'- {week}\n'
        md_string += '\n'

        md_string += '### Prerequisites\n'
        for prereq in course_dict["prerequisites"]:
            md_string += f'- {prereq}\n'
        md_string += '\n'

        md_string += '### Learning Outcomes\n'
        for outcome in course_dict["learning_outcomes"]:
            md_string += f'- {outcome}\n'
        md_string += '\n'

        md_string += '### Skills Acquired\n'
        for skill in course_dict["skills"]:
            md_string += f'- {skill}\n'
        md_string += '\n'

        logger.info("Successfully formatted course outline markdown")
        return md_string
    except Exception as e:
        logger.error(f"Error formatting course outline: {str(e)}")
        raise

def format_weekly_plan(week_module: Dict[str, Any], week_number: int) -> str:
    try:
        plan = f"# Week {week_number + 1} Topic: {week_module['week_topic']}\n\n"
        for idx1, module in enumerate(week_module['week_modules']):
            plan += f"## Module {week_number + 1}.{idx1 + 1}: {module['module_title']}\n"
            for idx, block in enumerate(module.get('content_blocks', []), 1):
                plan += f"- **Block {week_number + 1}.{idx1 + 1}.{idx}:** {block['block_title']}\n"
        logger.info(f"Formatted weekly plan for week {week_number + 1}")
        return plan
    except Exception as e:
        logger.error(f"Error formatting weekly plan for week {week_number + 1}: {str(e)}")
        raise

def generate_overall_plan(week_plans: List[str]) -> str:
    try:
        overall_plan = ""
        for idx, plan in enumerate(week_plans, 1):
            overall_plan += f"# Week : {idx}\n"
            overall_plan += plan + '\n'
        logger.info("Generated overall plan")
        return overall_plan
    except Exception as e:
        logger.error(f"Error generating overall plan: {str(e)}")
        raise

async def save_result(data: Any, path: str) -> None:
    try:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, 'w') as f:
            json.dump(data, f, indent=2)
        logger.info(f"Saved result to {path}")
    except Exception as e:
        logger.error(f"Failed to save result to {path}: {str(e)}")
        raise

def get_random_api_key(api_keys: List[str]) -> str:
    return random.choice(api_keys)

def initialize_client(api_keys: List[str]) -> genai.Client:
    try:
        api_key = get_random_api_key(api_keys)
        client = genai.Client(api_key=api_key)
        logger.info("Initialized Google GenAI client")
        return client
    except Exception as e:
        logger.error(f"Failed to initialize client: {str(e)}")
        raise

def create_cache(
    client: genai.Client,
    model_id: int,
    display_name: str,
    system_instruction: tuple,
    contents: Optional[tuple] = None
) -> str:
    cache_name = f"{display_name}-{uuid.uuid4()}"
    try:
        print(MODEL_MAP[model_id])
        cache = client.caches.create(
            model=MODEL_MAP[model_id],
            config=types.CreateCachedContentConfig(
                display_name=cache_name,
                system_instruction=system_instruction,
                contents=contents
            )
        )
        logger.info(f"Created cache: {cache_name}")
        return cache.name
    except Exception as e:
        logger.error(f"Failed to create cache {cache_name}: {str(e)}")
        raise

def delete_cache(client: genai.Client, cache_name: str) -> None:
    try:
        client.caches.delete(name=cache_name)
        logger.info(f"Deleted cache: {cache_name}")
    except Exception as e:
        logger.error(f"Failed to delete cache {cache_name}: {str(e)}")
        raise

# Model mapping
MODEL_MAP = {
    0: "gemini-2.0-flash",
    1: "gemini-2.5-flash",
    2: "gemini-2.5-pro"
}

def generate_content(
    client: genai.Client,
    model_id: int,
    contents: Any,
    cache_name: str,
    response_schema: Any
) -> Any:
    try:
        response = client.models.generate_content(
            model=MODEL_MAP[model_id],
            contents=contents,
            config=types.GenerateContentConfig(
                cached_content=cache_name,
                response_mime_type="application/json",
                response_schema=response_schema
            )
        )
        logger.info("Successfully generated content")
        return response.parsed.model_dump()
    except Exception as e:
        logger.error(f"Failed to generate content: {str(e)}")
        raise