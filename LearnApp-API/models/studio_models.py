from pydantic import BaseModel
from typing import List

class CourseSummary(BaseModel):
    course_id: str
    title: str
    overview: str
    total_weeks: int
    skills: List[str]
    course_progress: float  # New field