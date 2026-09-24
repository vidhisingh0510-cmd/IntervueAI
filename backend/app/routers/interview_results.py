from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user

from app.models.interview_session import InterviewSession
from app.models.interview import Interview
from app.models.question import Question
from app.models.interview_answer import InterviewAnswer

from app.schemas.interview_result import (
    InterviewResultResponse,
    CategoryScore,
)


router = APIRouter(
    prefix="/api/interview-results",
    tags=["Interview Results"],
)


@router.get(
    "/{session_id}",
    response_model=InterviewResultResponse,
)
def get_interview_result(
    session_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):

    # Find the interview session
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

    # Find the interview
    interview = (
        db.query(Interview)
        .filter(
            Interview.id == session.interview_id,
            Interview.user_id == current_user.id,
        )
        .first()
    )

    if not interview:
        raise HTTPException(
            status_code=404,
            detail="Interview not found.",
        )

    # Get all questions
    questions = (
        db.query(Question)
        .filter(
            Question.interview_id == interview.id
        )
        .all()
    )

    # Get all submitted answers
    answers = (
        db.query(InterviewAnswer)
        .filter(
            InterviewAnswer.session_id == session.id
        )
        .all()
    )

    total_questions = len(questions)
    answered_questions = len(answers)

    # Calculate overall score
    scores = [
        answer.score
        for answer in answers
        if answer.score is not None
    ]

    if scores:
        overall_score = round(
            sum(scores) / len(scores),
            2,
        )
    else:
        overall_score = None

    # Category-wise performance
    question_map = {
        question.id: question
        for question in questions
    }

    category_data = {}

    for answer in answers:

        question = question_map.get(answer.question_id)

        if not question:
            continue

        if answer.score is None:
            continue

        category = question.category

        if category not in category_data:
            category_data[category] = {
                "scores": [],
                "count": 0,
            }

        category_data[category]["scores"].append(
            answer.score
        )

        category_data[category]["count"] += 1

    category_scores = []

    for category, data in category_data.items():

        category_average = round(
            sum(data["scores"]) / len(data["scores"]),
            2,
        )

        category_scores.append(
            CategoryScore(
                category=category,
                average_score=category_average,
                question_count=data["count"],
            )
        )

    # Collect strengths and improvements
    strengths = []
    improvements = []

    for answer in answers:

        if answer.strengths:
            strengths.append(answer.strengths)

        if answer.improvements:
            improvements.append(answer.improvements)

    # Remove duplicate feedback
    strengths = list(dict.fromkeys(strengths))
    improvements = list(dict.fromkeys(improvements))

    # Keep the result readable
    strengths = strengths[:5]
    improvements = improvements[:5]

    return InterviewResultResponse(
        session_id=session.id,
        interview_id=interview.id,
        status=session.status,
        total_questions=total_questions,
        answered_questions=answered_questions,
        overall_score=overall_score,
        category_scores=category_scores,
        strengths=strengths,
        improvements=improvements,
    )