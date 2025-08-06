from pydantic import BaseModel
from typing import List
    
class Reference(BaseModel):
    title: str
    source: str
    
class Block(BaseModel):
    block_title: str
    length: int
    type: str
    objectives: List[str]
    references: List[Reference]
    
class Module(BaseModel):
    module_title: str
    duration_hours: float
    content_blocks: List[Block] 

class Milestone(BaseModel):
    milestone_title: str
    length: str
    type: str
    description: str
    objectives: List[str]
    prerequisites: List[str]
    deliverables: List[str]
    upload_required: bool 
    supported_filetypes: List[str]
    references: List[Reference]

class CourseOutline(BaseModel):
    title: str
    overview: str
    prerequisites: List[str]
    total_weeks: int 
    learning_outcomes: List[str] 
    skills: List[str]
    weeks: List[str]
    
class Week(BaseModel):
    week_number: int 
    week_topic: str 
    week_modules: List[Module] 
    hours_per_week: float 
    week_milestone: Milestone 