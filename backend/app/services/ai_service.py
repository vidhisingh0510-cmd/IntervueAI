import json
import time
from typing import Any

from google import genai
from google.genai import types

from app.core.database import settings


client = genai.Client(
    api_key=settings.GEMINI_API_KEY
)


def _get_ai_error_message(exc: Exception) -> str:
    error_text = str(exc)

    # Gemini free-tier quota/rate limit
    if (
        "429" in error_text
        or "RESOURCE_EXHAUSTED" in error_text
        or "quota" in error_text.lower()
    ):
        return (
            "AI quota has been reached for now. "
            "Please wait for the Gemini quota to reset "
            "and try again later."
        )

    # Temporary Gemini/server issue
    if (
        "503" in error_text
        or "UNAVAILABLE" in error_text
    ):
        return (
            "Gemini is temporarily unavailable. "
            "Please try again in a few minutes."
        )

    return (
        "AI service is temporarily unavailable. "
        "Please try again later."
    )


def research_interview_questions(
    company: str | None,
    role: str,
    job_description: str | None,
    resume_text: str | None = None,
) -> dict[str, Any]:

    company_text = company or "Not specified"

    jd_text = (
        job_description
        or "No job description provided."
    )

    resume_text_value = (
        resume_text
        or "No resume provided."
    )

    prompt = f"""
You are the interview question generation
engine for IntervueAI.

Create a realistic and personalized interview
question bank based on the candidate's resume,
company, role, and job description.

Company:
{company_text}

Role:
{role}

Job Description:
{jd_text}

Candidate Resume:
{resume_text_value}

Generate 15 interview questions.

IMPORTANT:

Personalize the questions using information
actually present in the resume.

Prioritize questions about:

1. Technical skills listed on the resume
2. Projects listed on the resume
3. Work or internship experience
4. Technologies and tools used
5. Concepts relevant to the job description
6. Behavioral and HR topics relevant to the role

Include a realistic mixture of:

- Technical
- Coding
- Behavioral
- HR

If the resume contains a project, you may ask
questions about its architecture, technologies,
implementation decisions, challenges, and results.

Do NOT invent projects, experience, skills,
companies, technologies, or achievements that
are not present in the resume.

Difficulty must be one of:

- Easy
- Medium
- Hard

Avoid duplicate or nearly identical questions.

Do NOT claim that a question was actually asked
by the company unless that information is
explicitly provided in the input.

Do not invent URLs or web sources.

Return ONLY valid JSON in exactly this structure:

{{
    "questions": [
        {{
            "question": "Question text",
            "category": "Technical",
            "difficulty": "Medium",
            "source_name": "AI Generated",
            "source_url": null
        }}
    ]
}}
"""

    max_attempts = 3
    response = None

    for attempt in range(max_attempts):
        try:
            response = client.models.generate_content(
                model=settings.AI_MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                ),
            )

            break

        except Exception as exc:
            error_text = str(exc)

            # 429 is a quota/rate-limit issue.
            # Retrying immediately will usually waste
            # another request, so stop immediately.
            is_quota_error = (
                "429" in error_text
                or "RESOURCE_EXHAUSTED" in error_text
                or "quota" in error_text.lower()
            )

            if is_quota_error:
                raise RuntimeError(
                    _get_ai_error_message(exc)
                ) from exc

            # 503 can be temporary, so retry.
            is_temporary_error = (
                "503" in error_text
                or "UNAVAILABLE" in error_text
            )

            if not is_temporary_error:
                raise RuntimeError(
                    _get_ai_error_message(exc)
                ) from exc

            if attempt == max_attempts - 1:
                raise RuntimeError(
                    _get_ai_error_message(exc)
                ) from exc

            wait_seconds = 2 ** attempt
            time.sleep(wait_seconds)

    if response is None:
        raise RuntimeError(
            "Gemini did not return a response."
        )

    text = response.text

    if not text:
        raise RuntimeError(
            "Gemini returned an empty response."
        )

    try:
        data = json.loads(text)

    except json.JSONDecodeError as exc:
        raise RuntimeError(
            "Gemini returned an invalid response. "
            "Please try again."
        ) from exc

    if "questions" not in data:
        raise RuntimeError(
            "Gemini response did not contain questions."
        )

    return data