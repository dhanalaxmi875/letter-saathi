from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import Response
from pydantic import BaseModel, Field

from app.services.gemma import analyze_document, ask_question
from app.services.tts import synthesize
from app.services.validator import validate_result

router = APIRouter()
MAX_UPLOAD_BYTES = 10 * 1024 * 1024
ALLOWED_TYPES = {"image/png", "image/jpeg", "application/pdf"}


class AskRequest(BaseModel):
    analysis: dict = Field(..., description="The full JSON object returned by /api/analyze")
    history: list = Field(default_factory=list, description="Chat history with role and text")
    question: str = Field(..., min_length=1, max_length=500, description="User's question")
    language: str = Field(..., pattern="^(en|te|hi)$", description="Language code")


@router.get("/health")
async def health():
    return {"status": "ok"}


@router.post("/analyze")
async def analyze(file: UploadFile = File(...), language: str = Form("en")):
    if language not in {"en", "te", "hi"}:
        raise HTTPException(status_code=400, detail="Choose English, Telugu, or Hindi.")
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Upload a PNG, JPEG, or PDF file.")
    data = await file.read(MAX_UPLOAD_BYTES + 1)
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="File is too large. Maximum size is 10 MB.")
    if not data:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")
    result = await analyze_document(data, file.content_type, language)
    return validate_result(result)


@router.post("/tts")
async def tts(payload: dict):
    text = payload.get("text", "")
    language = payload.get("language", "en")
    if not isinstance(text, str) or not text.strip() or language not in {"en", "te", "hi"}:
        raise HTTPException(status_code=400, detail="Provide text and a supported language.")
    audio = await synthesize(text[:1500], language)
    return Response(content=audio, media_type="audio/mpeg")


@router.post("/ask")
async def ask(payload: AskRequest):
    result = await ask_question(payload.analysis, payload.history, payload.question, payload.language)
    return result
