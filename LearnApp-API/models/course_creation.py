from pydantic import BaseModel, Field, validator

class CourseInput(BaseModel):
    topic: str
    experience: int
    total_weeks: int 
    hours_per_week: int
    learning_style: int
    motivation: int 
    custom_motivation: str

    
class GenaiInput(BaseModel):
    topic: str = Field(..., min_length=1, description="Topic to learn")
    experience: int = Field(..., ge=0, le=2, description="Experience level (0: I'm new, 1: I've tried it before, 2: I'm confident / advanced)")
    total_weeks: int = Field(..., inclusion=[4, 6, 8], description="Total weeks (4, 6, or 8)")
    hours_per_week: int = Field(..., ge=4, le=24, description="Hours per week (4 to 24)")
    learning_style: int = Field(..., ge=0, le=2, description="Learning style (0: Quick Course, 1: Skill Path, 2: Build-a-Project)")
    motivation: int = Field(..., ge=0, le=3, description="Motivation (0: Get a better job, 1: College help, 2: Just for fun, 3: Other)")
    custom_motivation: str = Field("", description="Custom motivation if motivation is 3")
    model_id: int = Field(..., ge=0, le=2, description="Model Ids ranging from 0,1,2")
    
class ProgressUpdate(BaseModel):
    step: str
    status: int  # 0: pending, 1: started, 2: success, 3: failed
    timestamp: str | None
    path: str | None = None
    error: str | None = None