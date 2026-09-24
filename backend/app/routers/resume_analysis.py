from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user

from app.models.resume import Resume

from app.schemas.resume_analysis import (
    ResumeAnalysisResponse,
)

from app.services.resume_analyzer import (
    analyze_resume,
)


router = APIRouter(
    prefix="/api/resume-analysis",
    tags=["Resume Analysis"],
)


@router.post(
    "/{resume_id}",
    response_model=ResumeAnalysisResponse,
)
def analyze_resume_endpoint(
    resume_id: int,
    role: str | None = None,
    job_description: str | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):

    resume = (
        db.query(Resume)
        .filter(
            Resume.id == resume_id,
            Resume.user_id == current_user.id,
        )
        .first()
    )

    if not resume:
        raise HTTPException(
            status_code=404,
            detail="Resume not found.",
        )

    if not resume.extracted_text:
        raise HTTPException(
            status_code=400,
            detail="Resume text is not available.",
        )

    try:
        analysis = analyze_resume(
            resume_text=resume.extracted_text,
            role=role,
            job_description=job_description,
        )

    except RuntimeError as exc:
        error_message = str(exc)

        if "AI quota has been reached" in error_message:
            raise HTTPException(
                status_code=429,
                detail=error_message,
            )

        raise HTTPException(
            status_code=500,
            detail=error_message,
        )

    except Exception:
        raise HTTPException(
            status_code=500,
            detail=(
                "Resume analysis failed. "
                "Please try again."
            ),
        )

    return ResumeAnalysisResponse(
        resume_id=resume.id,
        overall_score=int(
            analysis["overall_score"]
        ),
        summary=analysis["summary"],
        skills=analysis["skills"],
        education=analysis["education"],
        experience=analysis["experience"],
        projects=analysis["projects"],
        certifications=analysis["certifications"],
        strengths=analysis["strengths"],
        weaknesses=analysis["weaknesses"],
        missing_skills=analysis["missing_skills"],
        suggestions=analysis["suggestions"],
        job_match_score=analysis.get(
            "job_match_score"
        ),
    )