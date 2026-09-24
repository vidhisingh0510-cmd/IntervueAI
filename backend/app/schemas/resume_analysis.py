from typing import Optional

from pydantic import BaseModel


class ResumeAnalysisResponse(BaseModel):
    resume_id: int
    overall_score: int
    summary: str
    skills: list[str]
    education: list[str]
    experience: list[str]
    projects: list[str]
    certifications: list[str]
    strengths: list[str]
    weaknesses: list[str]
    missing_skills: list[str]
    suggestions: list[str]
    job_match_score: Optional[int] = None