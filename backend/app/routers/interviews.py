from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.interview import Interview
from app.models.user import User
from app.schemas.interview import InterviewCreate, InterviewResponse
from app.core.security import get_current_user


router = APIRouter(
    prefix="/api/interviews",
    tags=["Interviews"],
)


@router.post(
    "",
    response_model=InterviewResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_interview(
    data: InterviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    interview = Interview(
        user_id=current_user.id,
        title=data.title,
        role=data.role,
        company=data.company,
        difficulty=data.difficulty,
        interview_type=data.interview_type,
        job_description=data.job_description,
        resume_id=data.resume_id,
    )

    db.add(interview)
    db.commit()
    db.refresh(interview)

    return interview


@router.get("", response_model=list[InterviewResponse])
def get_interviews(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    interviews = (
        db.query(Interview)
        .filter(Interview.user_id == current_user.id)
        .order_by(Interview.created_at.desc())
        .all()
    )

    return interviews


@router.get("/{interview_id}", response_model=InterviewResponse)
def get_interview(
    interview_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    interview = (
        db.query(Interview)
        .filter(
            Interview.id == interview_id,
            Interview.user_id == current_user.id,
        )
        .first()
    )

    if not interview:
        raise HTTPException(
            status_code=404,
            detail="Interview not found",
        )

    return interview


@router.delete("/{interview_id}")
def delete_interview(
    interview_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    interview = (
        db.query(Interview)
        .filter(
            Interview.id == interview_id,
            Interview.user_id == current_user.id,
        )
        .first()
    )

    if not interview:
        raise HTTPException(
            status_code=404,
            detail="Interview not found",
        )

    db.delete(interview)
    db.commit()

    return {
        "message": "Interview deleted successfully",
        "interview_id": interview_id,
    }