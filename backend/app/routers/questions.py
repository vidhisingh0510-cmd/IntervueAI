from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user

from app.models.interview import Interview
from app.models.question import Question
from app.models.resume import Resume

from app.schemas.question import (
    QuestionResponse,
    ResearchResponse,
)

from app.services.ai_service import (
    research_interview_questions,
)


router = APIRouter(
    prefix="/api/questions",
    tags=["Questions"],
)


@router.post(
    "/research/{interview_id}",
    response_model=ResearchResponse,
)
def research_questions(
    interview_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
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
            detail="Interview not found.",
        )

    resume_text = None

    if interview.resume_id:
        resume = (
            db.query(Resume)
            .filter(
                Resume.id == interview.resume_id,
                Resume.user_id == current_user.id,
            )
            .first()
        )

        if resume:
            resume_text = resume.extracted_text

    try:
        ai_result = research_interview_questions(
            company=interview.company,
            role=interview.role,
            job_description=interview.job_description,
            resume_text=resume_text,
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
            detail="Question generation failed. Please try again.",
        )

    generated_questions = ai_result.get(
        "questions",
        []
    )

    saved_questions = []

    for item in generated_questions:
        question_text = item.get(
            "question",
            ""
        ).strip()

        if not question_text:
            continue

        existing_question = (
            db.query(Question)
            .filter(
                Question.interview_id
                == interview.id,
                Question.question
                == question_text,
            )
            .first()
        )

        if existing_question:
            saved_questions.append(
                existing_question
            )
            continue

        question = Question(
            interview_id=interview.id,
            question=question_text,
            category=item.get(
                "category",
                "Technical",
            ),
            difficulty=item.get(
                "difficulty",
                "Medium",
            ),
            source_name=item.get(
                "source_name",
                "AI Generated",
            ),
            source_url=item.get(
                "source_url"
            ),
        )

        db.add(question)
        saved_questions.append(question)

    db.commit()

    for question in saved_questions:
        db.refresh(question)

    return ResearchResponse(
        message=(
            "Personalized interview questions "
            "generated successfully."
        ),
        questions_found=len(
            saved_questions
        ),
        questions=saved_questions,
    )


@router.get(
    "/interview/{interview_id}",
    response_model=list[QuestionResponse],
)
def get_interview_questions(
    interview_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
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
            detail="Interview not found.",
        )

    return (
        db.query(Question)
        .filter(
            Question.interview_id
            == interview_id
        )
        .order_by(
            Question.created_at.asc()
        )
        .all()
    )


@router.delete(
    "/{question_id}"
)
def delete_question(
    question_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    question = (
        db.query(Question)
        .join(
            Interview,
            Question.interview_id
            == Interview.id,
        )
        .filter(
            Question.id == question_id,
            Interview.user_id
            == current_user.id,
        )
        .first()
    )

    if not question:
        raise HTTPException(
            status_code=404,
            detail="Question not found.",
        )

    db.delete(question)
    db.commit()

    return {
        "message": "Question deleted successfully."
    }