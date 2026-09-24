from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from app.core.database import Base


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)

    interview_id = Column(
        Integer,
        ForeignKey("interviews.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    question = Column(Text, nullable=False)

    category = Column(String(50), nullable=False)

    difficulty = Column(String(50), nullable=False)

    source_name = Column(String(255), nullable=True)

    source_url = Column(Text, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    __table_args__ = (
        UniqueConstraint(
            "interview_id",
            "question",
            name="uq_interview_question",
        ),
    )