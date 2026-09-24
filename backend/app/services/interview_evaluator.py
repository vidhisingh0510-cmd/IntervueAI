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


def evaluate_answer(
    question: str,
    answer: str,
    role: str,
) -> dict[str, Any]:

    prompt = f"""
You are an AI interview evaluator for IntervueAI.

Evaluate the candidate's answer objectively.

Role:
{role}

Interview Question:
{question}

Candidate Answer:
{answer}

Evaluate the answer based on:

1. Correctness
2. Relevance
3. Clarity
4. Depth
5. Communication

Give a score from 0 to 100.

Also provide:

- feedback
- strengths
- improvements

Be constructive and specific.

Return ONLY valid JSON in exactly this format:

{{
    "score": 75,
    "feedback": "Your answer demonstrates...",
    "strengths": "You clearly explained...",
    "improvements": "You could improve by..."
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

            # Do not retry quota errors.
            is_quota_error = (
                "429" in error_text
                or "RESOURCE_EXHAUSTED" in error_text
                or "quota" in error_text.lower()
            )

            if is_quota_error:
                raise RuntimeError(
                    _get_ai_error_message(exc)
                ) from exc

            # Retry temporary Gemini errors.
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
        "score",
        "feedback",
        "strengths",
        "improvements",
    ]

    for field in required_fields:
        if field not in data:
            raise RuntimeError(
                f"Gemini response is missing: {field}"
            )

    return data