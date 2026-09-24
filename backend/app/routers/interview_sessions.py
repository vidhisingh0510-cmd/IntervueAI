from datetime import datetime, timezone
import traceback

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user

from app.models.interview import Interview
from app.models.interview_session import InterviewSession
from app.models.question import Question
from app.models.interview_answer import InterviewAnswer

from app.schemas.interview_session import InterviewSessionResponse
from app.schemas.interview_answer import (
    SubmitAnswerRequest,
    InterviewAnswerResponse,
)

from app.services.interview_evaluator import evaluate_answer


router = APIRouter(
    prefix="/api/interview-sessions",
    tags=["Interview Sessions"],
)


@router.post(
    "/start/{interview_id}",
    response_model=InterviewSessionResponse,
)
def start_interview(
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
            detail="Interview not found",
        )

    question_count = (
        db.query(Question)
        .filter(
            Question.interview_id == interview_id
        )
        .count()
    )

    if question_count == 0:
        raise HTTPException(
            status_code=400,
            detail=(
                "No questions available. "
                "Research questions first."
            ),
        )

    session = InterviewSession(
        interview_id=interview_id,
        user_id=current_user.id,
        current_question_index=0,
        status="in_progress",
    )

    db.add(session)
    db.commit()
    db.refresh(session)

    return session


@router.get(
    "/{session_id}",
    response_model=InterviewSessionResponse,
)
def get_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    session = (
        db.query(InterviewSession)
        .filter(
            InterviewSession.id == session_id,
            InterviewSession.user_id == current_user.id,
        )
        .first()
    )

    if not session:
        raise HTTPException(
            status_code=404,
            detail="Interview session not found.",
        )

    return session


@router.post(
    "/{session_id}/answer",
    response_model=InterviewAnswerResponse,
)
def submit_answer(
    session_id: int,
    data: SubmitAnswerRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    session = (
        db.query(InterviewSession)
        .filter(
            InterviewSession.id == session_id,
            InterviewSession.user_id == current_user.id,
        )
        .first()
    )

    if not session:
        raise HTTPException(
            status_code=404,
            detail="Interview session not found",
        )

    if session.status != "in_progress":
        raise HTTPException(
            status_code=400,
            detail=(
                "This interview session is "
                "already completed."
            ),
        )

    question = (
        db.query(Question)
        .filter(
            Question.id == data.question_id,
            Question.interview_id == session.interview_id,
        )
        .first()
    )

    if not question:
        raise HTTPException(
            status_code=404,
            detail="Question not found.",
        )

    interview = (
        db.query(Interview)
        .filter(
            Interview.id == session.interview_id
        )
        .first()
    )

    if not interview:
        raise HTTPException(
            status_code=404,
            detail="Interview not found.",
        )

    try:
        evaluation = evaluate_answer(
            question=question.question,
            answer=data.answer,
            role=interview.role,
        )

    except RuntimeError as exc:
        error_message = str(exc)

        print(
            "\n========== AI EVALUATION ERROR =========="
        )
        print(error_message)
        traceback.print_exc()
        print("==========================================\n")

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
        print(
            "\n========== AI EVALUATION ERROR =========="
        )
        traceback.print_exc()
        print("==========================================\n")

        raise HTTPException(
            status_code=500,
            detail=(
                "AI evaluation failed. "
                "Please try again."
            ),
        )

    interview_answer = InterviewAnswer(
        session_id=session.id,
        question_id=question.id,
        answer=data.answer,
        score=int(evaluation["score"]),
        feedback=evaluation["feedback"],
        strengths=evaluation["strengths"],
        improvements=evaluation["improvements"],
    )

    db.add(interview_answer)

    session.current_question_index += 1

    total_questions = (
        db.query(Question)
        .filter(
            Question.interview_id
            == session.interview_id
        )
        .count()
    )

    if (
        session.current_question_index
        >= total_questions
    ):
        session.status = "completed"

        session.completed_at = datetime.now(
            timezone.utc
        )

        db.flush()

        answers = (
            db.query(InterviewAnswer)
            .filter(
                InterviewAnswer.session_id
                == session.id
            )
            .all()
        )

        scores = [
            answer.score
            for answer in answers
            if answer.score is not None
        ]

        if scores:
            session.total_score = round(
                sum(scores) / len(scores)
            )

    db.commit()
    db.refresh(interview_answer)

    return interview_answer


@router.get(
    "/{session_id}/answers",
    response_model=list[InterviewAnswerResponse],
)
def get_session_answers(
    session_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    session = (
        db.query(InterviewSession)
        .filter(
            InterviewSession.id == session_id,
            InterviewSession.user_id == current_user.id,
        )
        .first()
    )

    if not session:
        raise HTTPException(
            status_code=404,
            detail="Interview session not found",
        )

    return (
        db.query(InterviewAnswer)
        .filter(
            InterviewAnswer.session_id == session_id
        )
        .order_by(
            InterviewAnswer.created_at.asc()
        )
        .all()
    )