import logging
from typing import List, Dict, Any
from tenacity import retry, wait_exponential, stop_after_delay, stop_after_attempt, RetryError
from ollama import Client as OllamaClient
from utils.parsers import course_outline_parser, week_modules_parser, block_parser, block_metadata_parser, milestone_md_parser
from utils.generators import (
    generate_weekly_template,
    generate_weekly_metadata_template,
    generate_milestone_template,
    generate_weekly_modules_template,
    generate_course_milestone_template
)
import json
from prompts.PROMPTS import INPUT_MAPPING
from prompts.offline.course_outline import COURSE_COUTLINE_SYSTEM
from config.config import OLLAMA_ENDPOINT, GEMMA_MODEL
from fastapi import HTTPException

# Configure logging
logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# Retry settings
RETRY_SETTINGS = {
    'wait': wait_exponential(multiplier=1, min=4, max=30, exp_base=2),
    'stop': stop_after_delay(60) | stop_after_attempt(1),
    'after': lambda retry_state: logger.info(
        f"Retry attempt {retry_state.attempt_number} for {retry_state.fn.__name__}"
    ),
    'reraise': True
}

class CourseService:    
    def __init__(self, ollama_endpoint: str = OLLAMA_ENDPOINT):
        self.client = OllamaClient(host=ollama_endpoint)
        self.model = GEMMA_MODEL
        logger.info("Initialized CourseService with Ollama client")

    @retry(**RETRY_SETTINGS)
    async def generate_course_outline(self, mapped_inputs: dict, result_path: str) -> Dict[str, Any]:
        logger.info("Generating course outline")
        try:       
            # Construct user instruction
            user_instruction = (
                f"{INPUT_MAPPING['Topic']['prompt'].format(topic=mapped_inputs['topic'])}\n"
                f"{INPUT_MAPPING['Experience'][mapped_inputs['experience']]}\n"
                f"Total Weeks: {mapped_inputs['total_weeks']}\n"
                f"{INPUT_MAPPING['Hours']['Medium'].format(hours=mapped_inputs['hours_per_week'])}\n"
                f"{INPUT_MAPPING['LearningStyle'][mapped_inputs['learning_style']]}\n"
                f"{INPUT_MAPPING['Motivation'][mapped_inputs['motivation']].format(text=mapped_inputs['custom_motivation'])}"
            )
            response = self.client.chat(
                model=self.model,
                messages=[
                    {"role": "system", "content": COURSE_COUTLINE_SYSTEM.format(user_instruction=user_instruction)},
                ]
            )
            with open(result_path, 'w') as f:
                f.write(response['message']['content'])
            
            course_outline = course_outline_parser(response['message']['content'])
            course_outline['Duration'] = {
                "totalWeeks" : mapped_inputs['total_weeks'],
                "hoursPerWeek" : mapped_inputs['hours_per_week']
            }
            logger.debug(f"Generated course outline: {course_outline}")
            return course_outline
        except Exception as e:
            logger.error(f"Error generating course outline: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to generate course outline: {str(e)}")

    @retry(**RETRY_SETTINGS)
    async def generate_weekly_modules(self, course_outline: Dict[str, Any], motivation : str, custom_motivation : str, experience : str, result_path: str) -> List[Dict[str, Any]]:
        logger.info("Generating weekly modules")
        try:
            content = generate_weekly_modules_template(course_outline, motivation, custom_motivation, experience)
            response = self.client.chat(
                model=self.model,
                messages=[
                    {"role": "system", "content": content}
                ],
                options={"temperature": 0.5}
            )
            with open(result_path, 'w') as f:
                f.write(response['message']['content'])
            return week_modules_parser(response['message']['content'])
        except Exception as e:
            logger.error(f"Error generating weekly modules: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to generate weekly modules: {str(e)}")

    @retry(**RETRY_SETTINGS)
    async def generate_module_blocks(
        self,
        course_outline: Dict[str, Any],
        week_number: int,
        week_topic: str,
        week_modules: List[Dict[str, Any]],
        module_idx: int,
        motivation: str,
        custom_motivation: str,
        result_path: str
    ) -> List[Dict[str, Any]]:
        logger.info(f"Generating blocks for week {week_number}, module {module_idx}")
        try:
            content = generate_weekly_template(
                        course_data=course_outline,
                        week_number=week_number,
                        week_topic=week_topic,
                        course_week_data=week_modules,
                        idx=module_idx,
                        motivation=motivation,
                        custom_motivation=custom_motivation
                    )
            response = self.client.chat(
                model=self.model,
                messages=[
                    {"role": "system", "content": content}
                ],
                options={"temperature": 0.5}
            )
            
            blocks = block_parser(response['message']['content'])
            return blocks
        except Exception as e:
            logger.error(f"Error generating blocks for week {week_number}, module {module_idx}: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to generate blocks: {str(e)}")

    @retry(**RETRY_SETTINGS)
    async def generate_block_metadata(
        self,
        week_module: Dict[str, Any],
        module_idx: int,
        block_title: str,
        motivation: str,
        custom_motivation: str,
        response_path: str
    ) -> Dict[str, Any]:
        logger.info(f"Generating metadata for week {week_module['WeekNumber']}, module {module_idx}")
        try:
            content = generate_weekly_metadata_template(
                        week_module=week_module,
                        block_text=block_title,
                        idx=module_idx,
                        motivation=motivation,
                        custom_motivation=custom_motivation
                    )
            response = self.client.chat(
                model=self.model,
                messages=[
                    {"role": "system", "content": content}
                ],
                options={"temperature": 0.5}
            )
                
            metadata = block_metadata_parser(response['message']['content'], idx=module_idx)
            return metadata
        except Exception as e:
            logger.error(f"Error generating metadata for week {week_module['WeekNumber']}, module {module_idx}: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to generate block metadata: {str(e)}")

    @retry(**RETRY_SETTINGS)
    async def generate_weekly_milestone(self, plan: str, experience: str, motivation: str, result_path: str, week_number: int) -> str:
        logger.info("Generating weekly milestone")
        try:
            contents = generate_milestone_template(plan, experience, motivation)
            print(contents)
            response = self.client.chat(
                model=self.model,
                messages=[
                    {"role": "system", "content": contents}
                ],
                options={"temperature": 0.5}
            )
            result = milestone_md_parser(response['message']['content'])
            return result
        except Exception as e:
            logger.error(f"Error generating weekly milestone: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to generate weekly milestone: {str(e)}")

    @retry(**RETRY_SETTINGS)
    async def generate_course_milestone(self, overall_plan: str, experience: str, motivation: str, response_path: str) -> str:
        logger.info("Generating course milestone")
        try:
            contents =  generate_course_milestone_template(overall_plan, experience, motivation)
            response = self.client.chat(
                model=self.model,
                messages=[
                    {"role": "system", "content":contents}
                ],
                options={"temperature": 0.5}
            )
            result = milestone_md_parser(response['message']['content'])
            return result
        except Exception as e:
            logger.error(f"Error generating course milestone: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to generate course milestone: {str(e)}")
        
