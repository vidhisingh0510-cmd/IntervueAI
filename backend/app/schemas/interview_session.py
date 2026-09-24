from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class InterviewSessionResponse(BaseModel):
    id: int
    interview_id: int
    user_id: int
    current_question_index: int
    status: str
    total_score: Optional[int]
    created_at: datetime
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True