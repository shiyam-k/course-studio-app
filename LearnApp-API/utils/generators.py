from jinja2 import Template
from prompts.PROMPTS import INPUT_MAPPING
from prompts.offline.module_blocks import BLOCK_SYSTEM
from prompts.offline.block_metadata import BLOCK_METADATA_SYSTEM
from prompts.offline.weekly_milestone import MILESTONE_SYSTEM
from prompts.offline.weekly_modules import WEEKLY_MODULES_SYSTEM
from prompts.offline.course_milestone import COURSE_MILESTONE_SYSTEM
from math import ceil, floor
import logging

# Configure logging
logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

def generate_weekly_template(course_data, week_number, week_topic, course_week_data, idx, motivation, custom_motivation):
    try:
        weekly_template = Template(BLOCK_SYSTEM)
        motivation_ = ""
        if motivation == "other":
            motivation_=INPUT_MAPPING['Motivation'][motivation].format(text=custom_motivation)
        else:
            motivation_ = INPUT_MAPPING['Motivation'][motivation]
        weekly_module = weekly_template.render(
            course_title=course_data['Title'],
            overview=course_data['Overview'],
            week_number=week_number,
            week_topic=week_topic,
            module_topic=course_week_data[idx]['module_number'] + " " + course_week_data[idx]['module'],
            motivation=motivation_,
            module_duration=int(course_week_data[idx]['duration_hrs']),
        )
        return weekly_module
    except Exception as e:
        logger.error(f"Error generating weekly template for week {week_number}, module {idx}: {str(e)}")
        print(e)
        raise

def generate_weekly_metadata_template(week_module, block_text, idx, motivation, custom_motivation):
    block_metadata_template = Template(BLOCK_METADATA_SYSTEM)
    motivation_ = ""
    if motivation == "other":
        motivation_=INPUT_MAPPING['Motivation'][motivation].format(text=custom_motivation)
    else:
        motivation_ = INPUT_MAPPING['Motivation'][motivation]
    block_metadata_prompt = block_metadata_template.render(
        week_topic=week_module['WeekTopic'],
        week_hours=week_module['HoursPerWeek'],
        module_topic=week_module['WeekModules'][idx]['module'],
        module_duration=int(week_module['WeekModules'][idx]['duration_hrs'] * 60),
        blocks=block_text,
        motivation=motivation_
    )
    return block_metadata_prompt

def generate_milestone_template(week_plan, experience, motivation):
    milestone_template = Template(MILESTONE_SYSTEM)
    milestone_prompt = milestone_template.render(
        weekly_outline=week_plan,
        experience=INPUT_MAPPING['Experience'][experience],
        motivation=INPUT_MAPPING['Motivation'][motivation]
    )
    return milestone_prompt

def generate_weekly_modules_template(course_outline, motivation, custom_motivation, experience):
    template = Template(WEEKLY_MODULES_SYSTEM)
    minModules = ceil(course_outline["Duration"]["hoursPerWeek"] / 8.0)
    maxModules = floor(course_outline["Duration"]["hoursPerWeek"] / 3.0)
    rendered_prompt = template.render(
        Title=course_outline["Title"],
        Overview=course_outline["Overview"],
        totalWeeks=course_outline["Duration"]["totalWeeks"],
        hoursPerWeek=course_outline["Duration"]["hoursPerWeek"],
        LearningOutcomes="\n".join(f"- {o}" for o in course_outline["LearningOutcomes"]),
        Skills="\n".join(f"- {s}" for s in course_outline["Skills"]),
        minModules=minModules,
        maxModules=maxModules,
        user_instruction=INPUT_MAPPING['Motivation'][motivation].format(text=custom_motivation),
        experience=INPUT_MAPPING['Experience'][experience]
    )
    return rendered_prompt

def generate_block_title(week_module, idx):
    block_text = ""
    for j, i in enumerate(week_module['WeekModules'][idx]['ModuleBlocks']):
        block_text += f"ID : {j} | **{i['BlockTitle']}** | {i['Length']} Minutes ({i['Type']})\n"
    return block_text

def generate_overall_plan(week_plan):
    overall_plan = ""
    for idx, plan in enumerate(week_plan, 1):
        overall_plan += f"# Week : {idx}"
        overall_plan += plan + '\n'
    return overall_plan

def format_weekly_plan(week_module):
    try:
        plan = f"# Week Topic: {week_module['WeekTopic']}\n\n"
        for module in week_module['WeekModules']:
            plan += f"## Module {module['module_number']}: {module['module']}\n"
            for idx, block in enumerate(module.get('ModuleBlocks', []), 1):
                plan += f"- **Block {module['module_number']}.{idx}:** {block['BlockTitle']}\n"
        return plan
    except Exception as e:
        logger.error(f"Error formatting weekly plan for week {week_module['WeekNumber']}: {str(e)}")
        raise
    
def generate_course_milestone_template(overall_plan, experience, motivation):
     
    course_milestone_template = Template(COURSE_MILESTONE_SYSTEM)

    course_milestone_prompt = course_milestone_template.render(
        course_outline=overall_plan,
        experience=experience,
        motivation=motivation
    )
    
    return course_milestone_prompt