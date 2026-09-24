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


def analyze_resume(
    resume_text: str,
    role: str | None = None,
    job_description: str | None = None,
) -> dict[str, Any]:

    role_text = role or "Not specified"

    jd_text = (
        job_description
        or "No job description provided."
    )

    prompt = f"""
You are an AI resume analysis engine for
IntervueAI.

Analyze the candidate's resume carefully.

Candidate Resume:
{resume_text}

Target Role:
{role_text}

Job Description:
{jd_text}

Provide an objective analysis of the resume.

Return:

1. overall_score:
   A score from 0 to 100 based on:
   - clarity
   - technical skills
   - projects
   - experience
   - relevance
   - overall resume quality

2. summary:
   A concise summary of the candidate.

3. skills:
   Technical and professional skills explicitly
   present in the resume.

4. education:
   Education details explicitly present.

5. experience:
   Work/internship experience explicitly present.

6. projects:
   Projects explicitly present.

7. certifications:
   Certifications explicitly present.

8. strengths:
   Important strengths visible in the resume.

9. weaknesses:
   Areas where the resume could be improved.

10. missing_skills:
    Skills that appear relevant to the target role
    but are missing or not clearly demonstrated.

11. suggestions:
    Practical improvements for the resume.

12. job_match_score:
    If a job description is provided, give a score
    from 0 to 100 representing how closely the resume
    matches that job description.
    Otherwise return null.

Important rules:

- Do not invent information.
- Only identify education, experience, projects,
  certifications, and skills that are supported by
  the resume.
- Clearly distinguish missing information from
  information that is actually present.
- Do not claim that the candidate has experience
  that is not shown in the resume.

Return ONLY valid JSON in exactly this format:

{{
    "overall_score": 75,
    "summary": "Candidate summary",
    "skills": [],
    "education": [],
    "experience": [],
    "projects": [],
    "certifications": [],
    "strengths": [],
    "weaknesses": [],
    "missing_skills": [],
    "suggestions": [],
    "job_match_score": null
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

            # 429 means the Gemini quota/rate limit
            # has been reached. Do not retry it.
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

    required_fields = [
        "overall_score",
        "summary",
        "skills",
        "education",
        "experience",
        "projects",
        "certifications",
        "strengths",
        "weaknesses",
        "missing_skills",
        "suggestions",
        "job_match_score",
    ]

    for field in required_fields:
        if field not in data:
            raise RuntimeError(
                f"Gemini response is missing: {field}"
            )

    return data