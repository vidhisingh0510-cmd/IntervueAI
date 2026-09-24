from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class QuestionResponse(BaseModel):
    id: int
    interview_id: int
    question: str
    category: str
    difficulty: str
    source_name: Optional[str]
    source_url: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class ResearchResponse(BaseModel):
    message: str
    questions_found: int
    questions: list[QuestionResponse]