from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class SubmitAnswerRequest(BaseModel):
    question_id: int
    answer: str


class InterviewAnswerResponse(BaseModel):
    id: int
    session_id: int
    question_id: int
    answer: str
    score: Optional[int]
    feedback: Optional[str]
    strengths: Optional[str]
    improvements: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True