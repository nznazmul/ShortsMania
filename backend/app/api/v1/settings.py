import os
import shutil
from fastapi import APIRouter, HTTPException
import httpx

from app.core.config import settings
from app.models.schemas import SettingsSchema, SettingsUpdateRequest
from app.services.llm_service import llm_service
from app.services.media_service import media_service
from app.services.tts_service import tts_service

router = APIRouter(prefix="/settings", tags=["settings"])

@router.get("", response_model=SettingsSchema)
async def get_settings():
    """Returns current configuration status without exposing secret keys."""
    ffmpeg_path = settings.find_ffmpeg()
    ffmpeg_detected = bool(ffmpeg_path and (shutil.which(ffmpeg_path) or os.path.exists(ffmpeg_path)))

    return SettingsSchema(
        gemini_api_key_set=bool(settings.GEMINI_API_KEY),
        openai_api_key_set=bool(settings.OPENAI_API_KEY),
        pexels_api_key_set=bool(settings.PEXELS_API_KEY),
        pixabay_api_key_set=bool(settings.PIXABAY_API_KEY),
        elevenlabs_api_key_set=bool(settings.ELEVENLABS_API_KEY),
        default_aspect="9:16",
        default_voice="en-US-ChristopherNeural",
        ffmpeg_detected=ffmpeg_detected,
        ffmpeg_path=ffmpeg_path
    )

@router.post("", response_model=SettingsSchema)
async def update_settings(payload: SettingsUpdateRequest):
    """Updates API keys and propagates to services."""
    if payload.gemini_api_key is not None:
        settings.GEMINI_API_KEY = payload.gemini_api_key
        llm_service.update_keys(gemini_key=payload.gemini_api_key)

    if payload.openai_api_key is not None:
        settings.OPENAI_API_KEY = payload.openai_api_key
        llm_service.update_keys(openai_key=payload.openai_api_key)

    if payload.pexels_api_key is not None:
        settings.PEXELS_API_KEY = payload.pexels_api_key
        media_service.update_keys(pexels_key=payload.pexels_api_key)

    if payload.pixabay_api_key is not None:
        settings.PIXABAY_API_KEY = payload.pixabay_api_key
        media_service.update_keys(pixabay_key=payload.pixabay_api_key)

    if payload.elevenlabs_api_key is not None:
        settings.ELEVENLABS_API_KEY = payload.elevenlabs_api_key
        tts_service.update_key(elevenlabs_key=payload.elevenlabs_api_key)

    return await get_settings()

@router.post("/test-key")
async def test_api_key(provider: str, api_key: str):
    """Tests connectivity and authentication for a specific third-party provider."""
    try:
        if provider == "gemini":
            url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(url)
                if res.status_code == 200:
                    return {"valid": True, "provider": provider, "message": "Google Gemini API key is valid!"}
                return {"valid": False, "provider": provider, "message": f"Gemini Error ({res.status_code}): {res.text[:200]}"}

        elif provider == "openai":
            url = "https://api.openai.com/v1/models"
            headers = {"Authorization": f"Bearer {api_key}"}
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(url, headers=headers)
                if res.status_code == 200:
                    return {"valid": True, "provider": provider, "message": "OpenAI API key is valid!"}
                return {"valid": False, "provider": provider, "message": f"OpenAI Error: {res.text}"}

        elif provider == "pexels":
            url = "https://api.pexels.com/v1/curated?per_page=1"
            headers = {"Authorization": api_key}
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(url, headers=headers)
                if res.status_code == 200:
                    return {"valid": True, "provider": provider, "message": "Pexels API key is valid!"}
                return {"valid": False, "provider": provider, "message": f"Pexels Error: {res.text}"}

        elif provider == "elevenlabs":
            url = "https://api.elevenlabs.io/v1/voices"
            headers = {"xi-api-key": api_key}
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(url, headers=headers)
                if res.status_code == 200:
                    return {"valid": True, "provider": provider, "message": "ElevenLabs API key is valid!"}
                return {"valid": False, "provider": provider, "message": f"ElevenLabs Error: {res.text}"}

        else:
            raise HTTPException(status_code=400, detail=f"Unknown provider '{provider}'")

    except Exception as e:
        return {"valid": False, "provider": provider, "message": str(e)}
