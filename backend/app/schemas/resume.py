from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class ResumeResponse(BaseModel):
    id: int
    user_id: int
    filename: str
    extracted_text: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True