import threading
from typing import Any, Dict, List
from google import genai
from utils.genai import initialize_client, create_cache, delete_cache, generate_content, logger, courseoutline_md, format_weekly_plan, generate_overall_plan
from prompts.online.course_outliner import COURSE_OUTLINE_SYSTEM, COURSE_OUTLINE_FORMAT
from prompts.online.week_generator import WEEK_SYSTEM, WEEK_FORMAT
from prompts.online.course_milestone import MILESTONE_SYSTEM, MILESTONE_FORMAT
from prompts.online.system import SYSTEM_INSTRUCTION
from models.course_models import CourseOutline, Week, Milestone
from config.config import API_KEYS

class GenaiService:
    def generate_week_content(
        self,
        client: genai.Client,
        model_id: int,
        week: str,
        cache_name: str,
        response_schema: Any,
        results: List[Any],
        index: int
    ) -> None:
        """
        Generate content for a single week (thread-safe).
        
        Args:
            client: GenAI client instance.
            model_id: ID of the model to use.
            week: Week data for content generation.
            cache_name: Cache name for generation.
            response_schema: Schema for response validation.
            results: List to store results.
            index: Index for storing result.
        """
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

    async def generate_course_outline(self, user_instruction: str, model_id: int, response_dir: str) -> Dict[str, Any]:
        """
        Generate the course outline using the provided user instruction and model ID.
        
        Args:
            user_instruction (str): Formatted user input for course generation.
            model_id (int): ID of the model to use for generation.
            response_dir (str): Directory to save the generated output.
        
        Returns:
            Dict[str, Any]: Generated course outline.
        
        Raises:
            Exception: If generation or saving fails.
        """
        logger.info("Generating course outline")
        outline_client = initialize_client(API_KEYS)
        outline_cache_name = None
        try:
            outline_cache_name = create_cache(
                client=outline_client,
                model_id=model_id,
                display_name="course_outline",
                system_instruction=(SYSTEM_INSTRUCTION, COURSE_OUTLINE_SYSTEM, COURSE_OUTLINE_FORMAT),
                contents=(user_instruction)
            )
            course_outline = generate_content(
                client=outline_client,
                model_id=model_id,
                contents=user_instruction,
                cache_name=outline_cache_name,
                response_schema=CourseOutline
            )
            result_md = courseoutline_md(course_outline)
            with open(f"{response_dir}/course_outline.md", 'w') as f:
                f.write(result_md)
            return course_outline
        except Exception as e:
            logger.error(f"Failed to generate course outline: {str(e)}")
            raise
        finally:
            if outline_cache_name:
                delete_cache(outline_client, outline_cache_name)

    async def generate_weekly_content(
        self,
        user_instruction: str,
        model_id: int,
        course_outline: Dict[str, Any],
        response_dir: str
    ) -> List[Dict[str, Any]]:
        """
        Generate content for all weeks concurrently.
        
        Args:
            user_instruction (str): Formatted user input.
            model_id (int): ID of the model to use.
            course_outline (Dict[str, Any]): Course outline data.
            response_dir (str): Directory to save the generated output.
        
        Returns:
            List[Dict[str, Any]]: List of weekly content.
        
        Raises:
            Exception: If generation or saving fails.
        """
        logger.info("Generating weekly content")
        week_client = initialize_client(API_KEYS)
        week_cache_name = None
        try:
            result_md = open(f"{response_dir}/course_outline.md", 'r').read()
            week_cache_name = create_cache(
                client=week_client,
                model_id=model_id,
                display_name="weekly_content",
                system_instruction=(SYSTEM_INSTRUCTION, WEEK_SYSTEM, WEEK_FORMAT),
                contents=(user_instruction, result_md)
            )
            results = [None] * len(course_outline['weeks'])
            threads = []

            for i, week in enumerate(course_outline['weeks']):
                thread = threading.Thread(
                    target=self.generate_week_content,
                    args=(week_client, model_id, week, week_cache_name, Week, results, i)
                )
                threads.append(thread)
                thread.start()

            for thread in threads:
                thread.join()

            course_weeks = [r for r in results if r is not None]
            with open(f"{response_dir}/course_weeks.md", 'w') as f:
                for week_module in course_weeks:
                    f.write(format_weekly_plan(week_module, week_module['week_number'] - 1) + '\n')
            return course_weeks
        except Exception as e:
            logger.error(f"Failed to generate weekly content: {str(e)}")
            raise
        finally:
            if week_cache_name:
                delete_cache(week_client, week_cache_name)

    async def generate_weekly_plans(self, course_weeks: List[Dict[str, Any]], response_dir: str) -> List[str]:
        """
        Generate weekly plans from course weeks.
        
        Args:
            course_weeks (List[Dict[str, Any]]): List of weekly content.
            response_dir (str): Directory to save the generated output.
        
        Returns:
            List[str]: List of formatted weekly plans.
        
        Raises:
            Exception: If generation or saving fails.
        """
        logger.info("Generating weekly plans")
        try:
            week_plans = [
                format_weekly_plan(week_module, i)
                for i, week_module in enumerate(course_weeks)
            ]
            return week_plans
        except Exception as e:
            logger.error(f"Failed to generate weekly plans: {str(e)}")
            raise

    async def generate_course_milestone(
        self,
        user_instruction: str,
        model_id: int,
        week_plans: List[str],
        response_dir: str
    ) -> Dict[str, Any]:
        """
        Generate the course milestone.
        
        Args:
            user_instruction (str): Formatted user input.
            model_id (int): ID of the model to use.
            week_plans (List[str]): List of weekly plans.
            response_dir (str): Directory to save the generated output.
        
        Returns:
            Dict[str, Any]: Generated course milestone.
        
        Raises:
            Exception: If generation or saving fails.
        """
        logger.info("Generating course milestone")
        milestone_client = initialize_client(API_KEYS)
        milestone_cache_name = None
        try:
            result_md = open(f"{response_dir}/course_outline.md", 'r').read()
            overall_plan = generate_overall_plan(week_plans)
            milestone_cache_name = create_cache(
                client=milestone_client,
                model_id=model_id,
                display_name="course_milestone",
                system_instruction=(SYSTEM_INSTRUCTION, MILESTONE_SYSTEM, MILESTONE_FORMAT),
                contents=(user_instruction, result_md)
            )
            course_milestone = generate_content(
                client=milestone_client,
                model_id=model_id,
                contents=overall_plan,
                cache_name=milestone_cache_name,
                response_schema=Milestone
            )
            return course_milestone
        except Exception as e:
            logger.error(f"Failed to generate course milestone: {str(e)}")
            raise
        finally:
            if milestone_cache_name:
                delete_cache(milestone_client, milestone_cache_name)

    async def transform_result(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Transform the result into the desired output format.
        
        Args:
            result (Dict[str, Any]): Raw result data.
        
        Returns:
            Dict[str, Any]: Transformed result.
        """
        logger.info("Transforming result")
        transformed_result = {
            "course_outline": {
                "title": result['course_outline']['title'],
                "overview": result['course_outline']['overview'],
                "prerequisites": [
                    prereq for prereq in result['course_outline']['prerequisites']
                ],
                "total_weeks": int(result['course_outline']['total_weeks']),
                "learning_outcomes": result['course_outline']['learning_outcomes'],
                "skills": result['course_outline']['skills'],
                "weeks": [],
                "course_milestone": {
                    "milestone_title": result['course_milestone'].get('milestone_title', ""),
                    "description": result['course_milestone'].get('description', ""),
                    "objectives": result['course_milestone'].get('objectives', []),
                    "prerequisites": result['course_milestone'].get('prerequisites', []),
                    "deliverables": result['course_milestone'].get('deliverables', []),
                    "upload_required": result['course_milestone'].get('upload_required', False),
                    "supported_filetypes": result['course_milestone'].get('supported_filetypes', []),
                    "references": result['course_milestone'].get('references', []),
                    "length": result['course_milestone'].get('length', ""),
                    "type": result['course_milestone'].get('type', "")
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
                    "milestone_title": week_module.get('week_milestone', {}).get('milestone_title', "NA"),
                    "description": week_module.get('week_milestone', {}).get('description', "NA"),
                    "objectives": week_module.get('week_milestone', {}).get('objectives', "NA"),
                    "prerequisites": week_module.get('week_milestone', {}).get('prerequisites', "NA"),
                    "deliverables": week_module.get('week_milestone', {}).get('deliverables', "NA"),
                    "upload_required": week_module.get('week_milestone', {}).get('upload_required', "NA"),
                    "supported_filetypes": week_module.get('week_milestone', {}).get('supported_filetypes', "NA"),
                    "references": week_module.get('week_milestone', {}).get('references', "NA"),
                    "length": week_module.get('week_milestone', {}).get('length', "NA"),
                    "type": week_module.get('week_milestone', {}).get('type', "NA")
                }
            }

            for module in week_module['week_modules']:
                content_blocks = [
                    {
                        "block_title": block['block_title'],
                        "length": block.get('length', 0),
                        "type": block.get('type', "Content"),
                        "objectives": block.get('objectives', "objectives"),
                        "references": block.get('references', "references"),
                        "completed": False
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