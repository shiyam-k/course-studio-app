from models.course_creation import CourseInput
from typing import Dict, Any
import os
import json

def map_inputs(course_input: CourseInput) -> Dict[str, Any]:
    experience_map = {0: "I'm new", 1: "I've tried it before", 2: "I'm confident / advanced"}
    learning_style_map = {0: "Quick Course", 1: "Skill Path", 2: "Build-a-Project"}
    motivation_map = {0: "Get a better job", 1: "College help", 2: "Just for fun", 3: "Other"}
    
    return {
        "topic": course_input.topic,
        "experience": experience_map[course_input.experience],
        "total_weeks": f"{course_input.total_weeks} weeks",
        "hours_per_week": course_input.hours_per_week,
        "learning_style": learning_style_map[course_input.learning_style],
        "motivation": motivation_map[course_input.motivation],
        "custom_motivation": course_input.custom_motivation
    }

async def save_result(result: Any, path: str):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w') as f:
        json.dump(result, f, indent=4)
        
def get_difficulty_level(hours: int) -> str:
    if 4 <= hours <= 10:
        return "Low"
    elif 11 <= hours <= 18:
        return "Medium"
    elif 19 <= hours <= 25:
        return "High"
    
def convert_json_to_markdown(course_data: dict) -> str:
    """
    Convert JSON course outline to Markdown format.
    
    Args:
        course_data: Dictionary containing the course outline JSON.
    
    Returns:
        Markdown string representing the course outline.
    """
    course = course_data["course_outline"]
    markdown = []

    # Course Title and Overview
    markdown.append(f"# {course['title']}\n")
    markdown.append(f"**Overview**: {course['overview']}\n")
    
    # Prerequisites
    markdown.append("## Prerequisites\n")
    for prereq in course["prerequisites"]:
        markdown.append(f"- {prereq}")
    markdown.append("\n")
    
    # Learning Outcomes
    markdown.append("## Learning Outcomes\n")
    for outcome in course["learning_outcomes"]:
        markdown.append(f"- {outcome}")
    markdown.append("\n")
    
    # Skills
    markdown.append("## Skills\n")
    for skill in course["skills"]:
        markdown.append(f"- {skill}")
    markdown.append("\n")
    
    # Weeks
    for week in course["weeks"]:
        markdown.append(f"## Week {week['week_number']}: {week['week_topic']}\n")
        for module in week["week_modules"]:
            markdown.append(f"### {module['module_title']} ({module['duration_hours']} hours)\n")
            for block in module["content_blocks"]:
                markdown.append(f"#### {block['block_title']} ({block['length']} minutes, {block['type']})\n")
                markdown.append("**Objectives**:\n")
                for obj in block["objectives"]:
                    markdown.append(f"- {obj}")
                markdown.append("\n**References**:\n")
                for ref in block["references"]:
                    markdown.append(f"- {ref['title']} ({ref['source']})")
                markdown.append("\n")
        
        # Week Milestone
        milestone = week["week_milestone"]
        markdown.append(f"### Week Milestone: {milestone['milestone_title']}\n")
        markdown.append(f"**Description**: {milestone['description']}\n")
        markdown.append("**Objectives**:\n")
        for obj in milestone["objectives"]:
            markdown.append(f"- {obj}")
        markdown.append("\n**Deliverables**:\n")
        for deliverable in milestone["deliverables"]:
            markdown.append(f"- {deliverable}")
        markdown.append("\n**References**:\n")
        for ref in milestone["references"]:
            markdown.append(f"- {ref['title']} ({ref['source']})")
        markdown.append("\n")
    
    # Course Milestone
    milestone = course["course_milestone"]
    markdown.append(f"## Course Milestone: {milestone['milestone_title']}\n")
    markdown.append(f"**Description**: {milestone['description']}\n")
    markdown.append("**Objectives**:\n")
    for obj in milestone["objectives"]:
        markdown.append(f"- {obj}")
    markdown.append("\n**Deliverables**:\n")
    for deliverable in milestone["deliverables"]:
        markdown.append(f"- {deliverable}")
    markdown.append("\n**References**:\n")
    for ref in milestone["references"]:
        markdown.append(f"- {ref['title']} ({ref['source']})")
    
    return "\n".join(markdown)
