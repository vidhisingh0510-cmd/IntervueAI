from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import Base, engine

from app.models import (
    User,
    Interview,
    Question,
    InterviewSession,
    InterviewAnswer,
    Resume,
)

from app.routers.auth import router as auth_router
from app.routers.interviews import router as interviews_router
from app.routers.questions import router as questions_router
from app.routers.interview_sessions import (
    router as interview_sessions_router,
)
from app.routers.interview_results import (
    router as interview_results_router,
)
from app.routers.resumes import (
    router as resumes_router,
)
from app.routers.resume_analysis import (
    router as resume_analysis_router,
)
from app.routers.analytics import (
    router as analytics_router,
)


# Create database tables
Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="IntervueAI API"
)


# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Routers
app.include_router(auth_router)
app.include_router(interviews_router)
app.include_router(questions_router)
app.include_router(interview_sessions_router)
app.include_router(interview_results_router)
app.include_router(resumes_router)
app.include_router(resume_analysis_router)
app.include_router(analytics_router)


@app.get("/")
def root():
    return {
        "message": "IntervueAI API is running"
    }


@app.get("/api/health")
def health():
    return {
        "status": "healthy"
    }