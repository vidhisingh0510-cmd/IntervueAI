from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    GEMINI_API_KEY: str
    AI_MODEL: str = "gemini-3.8-flash"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()

engine = create_engine(settings.DATABASE_URL)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()