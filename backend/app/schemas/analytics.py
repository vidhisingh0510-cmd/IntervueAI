from typing import Optional

from pydantic import BaseModel


class CategoryPerformance(BaseModel):
    category: str
    average_score: float
    questions_answered: int


class RecentInterview(BaseModel):
    session_id: int
    interview_id: int
    title: str
    role: str
    company: Optional[str]
    score: Optional[float]
    status: str
    completed_at: Optional[str]


class AnalyticsResponse(BaseModel):
    total_interviews: int
    completed_interviews: int
    total_questions_answered: int
    average_score: Optional[float]
    category_performance: list[CategoryPerformance]
    recent_interviews: list[RecentInterview]