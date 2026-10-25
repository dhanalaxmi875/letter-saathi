import os

import httpx
from fastapi import HTTPException


async def synthesize(text: str, language: str) -> bytes:
    key = os.getenv("ELEVENLABS_API_KEY")
    voice = os.getenv("ELEVENLABS_VOICE_ID")
    if not key or not voice:
        raise HTTPException(status_code=503, detail="Audio reading is not configured.")
    model = os.getenv("ELEVENLABS_MODEL", "eleven_multilingual_v2")
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                f"https://api.elevenlabs.io/v1/text-to-speech/{voice}",
                headers={"xi-api-key": key, "Content-Type": "application/json", "Accept": "audio/mpeg"},
                json={"text": text, "model_id": model, "language_code": language},
            )
        if response.status_code >= 400:
            raise HTTPException(status_code=503, detail="Audio reading is unavailable right now.")
        return response.content
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=503, detail="Audio reading is unavailable right now.") from exc
