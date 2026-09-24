import os
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pypdf import PdfReader
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.resume import Resume
from app.schemas.resume import ResumeResponse


router = APIRouter(
    prefix="/api/resumes",
    tags=["Resumes"],
)


UPLOAD_DIR = "uploads/resumes"

os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post(
    "/upload",
    response_model=ResumeResponse,
)
async def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="Please select a resume file.",
        )

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF resumes are supported.",
        )

    file_content = await file.read()

    if not file_content:
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is empty.",
        )

    unique_filename = (
        f"{uuid.uuid4().hex}_{file.filename}"
    )

    file_path = os.path.join(
        UPLOAD_DIR,
        unique_filename,
    )

    with open(file_path, "wb") as output_file:
        output_file.write(file_content)

    try:
        reader = PdfReader(file_path)

        extracted_pages = []

        for page in reader.pages:
            page_text = page.extract_text()

            if page_text:
                extracted_pages.append(page_text)

        extracted_text = "\n".join(
            extracted_pages
        ).strip()

    except Exception as exc:
        if os.path.exists(file_path):
            os.remove(file_path)

        raise HTTPException(
            status_code=400,
            detail=f"Unable to read PDF: {str(exc)}",
        )

    if not extracted_text:
        if os.path.exists(file_path):
            os.remove(file_path)

        raise HTTPException(
            status_code=400,
            detail=(
                "Could not extract text from this PDF. "
                "Please upload a text-based PDF resume."
            ),
        )

    resume = Resume(
        user_id=current_user.id,
        filename=file.filename,
        file_path=file_path,
        extracted_text=extracted_text,
    )

    db.add(resume)
    db.commit()
    db.refresh(resume)

    return resume


@router.get(
    "/",
    response_model=list[ResumeResponse],
)
def get_resumes(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return (
        db.query(Resume)
        .filter(
            Resume.user_id == current_user.id
        )
        .order_by(
            Resume.created_at.desc()
        )
        .all()
    )


@router.get(
    "/{resume_id}",
    response_model=ResumeResponse,
)
def get_resume(
    resume_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    resume = (
        db.query(Resume)
        .filter(
            Resume.id == resume_id,
            Resume.user_id == current_user.id,
        )
        .first()
    )

    if not resume:
        raise HTTPException(
            status_code=404,
            detail="Resume not found.",
        )

    return resume


@router.delete(
    "/{resume_id}",
)
def delete_resume(
    resume_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    resume = (
        db.query(Resume)
        .filter(
            Resume.id == resume_id,
            Resume.user_id == current_user.id,
        )
        .first()
    )

    if not resume:
        raise HTTPException(
            status_code=404,
            detail="Resume not found.",
        )

    if (
        resume.file_path
        and os.path.exists(resume.file_path)
    ):
        os.remove(resume.file_path)

    db.delete(resume)
    db.commit()

    return {
        "message": "Resume deleted successfully."
    }