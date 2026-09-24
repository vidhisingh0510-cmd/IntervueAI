from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user

from app.models.interview import Interview
from app.models.interview_session import InterviewSession
from app.models.interview_answer import InterviewAnswer
from app.models.question import Question

from app.schemas.analytics import (
    AnalyticsResponse,
    CategoryPerformance,
    RecentInterview,
)


router = APIRouter(
    prefix="/api/analytics",
    tags=["Analytics"],
)


@router.get(
    "/dashboard",
    response_model=AnalyticsResponse,
)
def get_dashboard_analytics(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    interviews = (
        db.query(Interview)
        .filter(
            Interview.user_id
            == current_user.id
        )
        .all()
    )

    sessions = (
        db.query(InterviewSession)
        .filter(
            InterviewSession.user_id
            == current_user.id
        )
        .all()
    )

    completed_sessions = [
        session
        for session in sessions
        if session.status == "completed"
    ]

    answers = (
        db.query(InterviewAnswer)
        .join(
            InterviewSession,
            InterviewAnswer.session_id
            == InterviewSession.id,
        )
        .filter(
            InterviewSession.user_id
            == current_user.id
        )
        .all()
    )

    scores = [
        answer.score
        for answer in answers
        if answer.score is not None
    ]

    average_score = None

    if scores:
        average_score = round(
            sum(scores) / len(scores),
            2,
        )

    question_ids = [
        answer.question_id
        for answer in answers
    ]

    questions = []

    if question_ids:
        questions = (
            db.query(Question)
            .filter(
                Question.id.in_(question_ids)
            )
            .all()
        )

    question_map = {
        question.id: question
        for question in questions
    }

    category_data = {}

    for answer in answers:
        if answer.score is None:
            continue

        question = question_map.get(
            answer.question_id
        )

        if not question:
            continue

        category = question.category

        if category not in category_data:
            category_data[category] = {
                "scores": [],
                "count": 0,
            }

        category_data[category][
            "scores"
        ].append(answer.score)

        category_data[category][
            "count"
        ] += 1

    category_performance = []

    for category, data in category_data.items():
        category_average = round(
            sum(data["scores"])
            / len(data["scores"]),
            2,
        )

        category_performance.append(
            CategoryPerformance(
                category=category,
                average_score=category_average,
                questions_answered=data["count"],
            )
        )

    session_interviews = []

    interview_map = {
        interview.id: interview
        for interview in interviews
    }

    for session in completed_sessions:
        interview = interview_map.get(
            session.interview_id
        )

        if not interview:
            continue

        session_interviews.append(
            RecentInterview(
                session_id=session.id,
                interview_id=interview.id,
                title=interview.title,
                role=interview.role,
                company=interview.company,
                score=session.total_score,
                status=session.status,
                completed_at=(
                    session.completed_at.isoformat()
                    if session.completed_at
                    else None
                ),
            )
        )

    session_interviews.sort(
        key=lambda item: item.completed_at
        or "",
        reverse=True,
    )

    return AnalyticsResponse(
        total_interviews=len(interviews),
        completed_interviews=len(
            completed_sessions
        ),
        total_questions_answered=len(answers),
        average_score=average_score,
        category_performance=category_performance,
        recent_interviews=session_interviews[
            :5
        ],
    )