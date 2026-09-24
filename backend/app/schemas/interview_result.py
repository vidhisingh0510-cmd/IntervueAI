from typing import Optional

from pydantic import BaseModel


class CategoryScore(BaseModel):
    category: str
    average_score: float
    question_count: int


class InterviewResultResponse(BaseModel):
    session_id: int
    interview_id: int
    status: str
    total_questions: int
    answered_questions: int
    overall_score: Optional[float]

    category_scores: list[CategoryScore]

    strengths: list[str]
    improvements: list[str]