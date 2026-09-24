from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class InterviewCreate(BaseModel):
    title: str
    role: str
    company: Optional[str] = None
    difficulty: str
    interview_type: str
    job_description: Optional[str] = None
    resume_id: Optional[int] = None

class InterviewResponse(BaseModel):
    id: int
    user_id: int
    title: str
    role: str
    company: Optional[str]
    difficulty: str
    interview_type: str
    job_description: Optional[str]
    status: str
    created_at: datetime
    updated_at: Optional[datetime]
    resume_id: Optional[int]
    class Config:
        from_attributes = True