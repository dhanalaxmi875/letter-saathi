import json
import os
import re

from fastapi import HTTPException
from google import genai
from google.genai import types

LANGUAGES = {"en": "English", "te": "Telugu", "hi": "Hindi"}
SCHEMA = '''{"document_type":"string","purpose":"string","deadline":{"value":null,"status":"found | missing_from_provided_text | unclear"},"important_facts":["string"],"required_actions":["string"],"required_documents":["string"],"amounts":["string"],"consequences":["string"],"simple_explanation":"string","human_verification_required":true,"uncertainties":["string"],"warnings":[]}'''


async def ask_question(analysis: dict, history: list, question: str, language: str) -> dict:
    if not os.getenv("GEMINI_API_KEY"):
        raise HTTPException(status_code=503, detail="Document analysis is not configured. Set GEMINI_API_KEY on the server.")
    if not question or not question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")
    if len(question) > 500:
        raise HTTPException(status_code=400, detail="Question is too long. Maximum 500 characters.")
    if language not in LANGUAGES:
        raise HTTPException(status_code=400, detail="Choose English, Telugu, or Hindi.")
    try:
        client = genai.Client()
        history_trimmed = history[-6:] if len(history) > 6 else history
        history_text = "\n".join([f"{turn['role']}: {turn['text']}" for turn in history_trimmed])
        prompt = f'''You help a person understand ONE official letter. Answer only from the LETTER FACTS below.

LETTER FACTS:
{json.dumps(analysis, ensure_ascii=False)}

CHAT HISTORY:
{history_text if history_text else "(no previous conversation)"}

USER QUESTION:
{question}

Rules:
- Answer only from the letter facts. If the answer is not in them, start your answer with "[NOT_IN_LETTER]" and then say clearly that the letter does not say this, and suggest contacting the issuing office. Never invent dates, amounts, penalties, legal outcomes, or procedures.
- For "what happens if I miss the deadline" type questions, only state consequences listed in the facts. Otherwise say the letter does not specify, and advise contacting the office.
- Do not give legal, medical, or financial advice beyond what the letter states.
- Reply in {LANGUAGES[language]} in very simple words, 2-4 short sentences. Keep names, dates, amounts, and reference numbers exactly as in the facts.
- End with nothing extra (no markdown, no preamble).
- If the question is unrelated to the letter, politely say you can only help with this letter.'''
        response = client.models.generate_content(
            model=os.getenv("GEMMA_MODEL", "gemma-4-31b-it"),
            contents=prompt,
        )
        answer = (response.text or "").strip()
        grounded = True
        if answer.startswith("[NOT_IN_LETTER]"):
            answer = answer.replace("[NOT_IN_LETTER]", "").strip()
            grounded = False
        return {"answer": answer, "grounded": grounded}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Could not answer the question. Please try again.") from exc


def _extract_json(text: str) -> dict:
    text = re.sub(r"^\s*```(?:json)?\s*|\s*```\s*$", "", text.strip(), flags=re.I)
    start, end = text.find("{"), text.rfind("}")
    if start < 0 or end < start:
        raise ValueError("No JSON object")
    return json.loads(text[start : end + 1])


async def analyze_document(data: bytes, mime_type: str, language: str) -> dict:
    if not os.getenv("GEMINI_API_KEY"):
        raise HTTPException(status_code=503, detail="Document analysis is not configured. Set GEMINI_API_KEY on the server.")
    try:
        client = genai.Client()
        parts = []
        if mime_type == "application/pdf":
            try:
                import fitz
                pdf = fitz.open(stream=data, filetype="pdf")
                if pdf.page_count == 0:
                    raise ValueError("empty PDF")
                for page in pdf[:4]:
                    pix = page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5), alpha=False)
                    parts.append(types.Part.from_bytes(data=pix.tobytes("png"), mime_type="image/png"))
            except Exception as exc:
                raise HTTPException(status_code=400, detail="Could not read this PDF. Please try another file.") from exc
        else:
            parts.append(types.Part.from_bytes(data=data, mime_type=mime_type))
        prompt = f'''Read the official letter in the attached image(s). Return ONLY JSON matching exactly this shape: {SCHEMA}
Never invent information. If a deadline, amount, name or reference number is not clearly visible, use null (where the schema permits) and add a note to uncertainties. Keep names, dates, amounts, reference numbers and document names exactly as written; do not translate or transliterate them. Write simple_explanation, required_actions and consequences in {LANGUAGES[language]}, using very simple words suitable for someone with low English literacy. Keep other field keys in English. Flag unfilled placeholders such as [Date], ____ or "as per schedule" when no schedule is attached. If deadline is not clear, set value to null and status to missing_from_provided_text or unclear. Use empty arrays when no items are present. human_verification_required must be true.'''
        for attempt in range(2):
            response = client.models.generate_content(
                model=os.getenv("GEMMA_MODEL", "gemma-4-31b-it"),
                contents=[*parts, prompt + ("\nReturn only valid JSON. Do not include markdown or any text outside the JSON object." if attempt else "")],
            )
            try:
                return _extract_json(response.text or "")
            except (ValueError, json.JSONDecodeError):
                continue
        raise HTTPException(status_code=502, detail="We could not read a clear result from the letter. Please try again with a sharper image.")
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Letter analysis failed. Please try again.") from exc
