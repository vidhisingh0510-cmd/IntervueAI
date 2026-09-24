from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func

from app.core.database import Base


class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id = Column(Integer, primary_key=True, index=True)

    interview_id = Column(
        Integer,
        ForeignKey("interviews.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    current_question_index = Column(
        Integer,
        nullable=False,
        default=0,
    )

    status = Column(
        String(50),
        nullable=False,
        default="in_progress",
    )

    total_score = Column(
        Integer,
        nullable=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    completed_at = Column(
        DateTime(timezone=True),
        nullable=True,
    )