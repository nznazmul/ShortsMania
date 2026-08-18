import os
import uuid
import shutil
from pathlib import Path
from typing import List
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel

from app.core.config import settings
from app.models.schemas import VoiceItem, BgmItem
from app.services.tts_service import tts_service
from app.services.video_engine import video_engine

router = APIRouter(prefix="/media", tags=["media"])

class VoicePreviewRequest(BaseModel):
    voice_name: str = "en-US-ChristopherNeural"
    text: str = "Welcome to ShortsMania. Create viral automated AI short videos in seconds."
    rate: float = 1.0
    pitch: int = 0

@router.get("/voices", response_model=List[VoiceItem])
async def list_voices():
    """Lists all available high-quality neural TTS voices."""
    return tts_service.get_available_voices()

@router.post("/tts/preview")
async def preview_voice(request: VoicePreviewRequest):
    """Generates an instant MP3 preview clip for the chosen TTS voice."""
    preview_id = str(uuid.uuid4())
    preview_path = str(settings.TEMP_DIR / f"preview_{preview_id}.mp3")
    try:
        await tts_service.synthesize_speech(
            text=request.text,
            output_audio_path=preview_path,
            voice=request.voice_name,
            rate=request.rate,
            pitch=request.pitch
        )
        return FileResponse(preview_path, media_type="audio/mpeg", filename="voice_preview.mp3")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Voice preview failed: {str(e)}")

@router.get("/bgm", response_model=List[BgmItem])
async def list_bgm():
    """Lists available royalty-free background music tracks."""
    # Ensure default tracks exist
    default_tracks = [
        ("ambient_synth", "Ambient Cyberpunk Synth", "Ambient", 60.0),
        ("lofi_chill", "Chill Lo-Fi Study Beats", "Lo-Fi", 60.0),
        ("cinematic_rise", "Cinematic Suspense Tension", "Cinematic", 60.0),
        ("upbeat_tech", "Upbeat Modern Electronic", "Electronic", 60.0),
    ]

    results = []
    for tid, name, cat, dur in default_tracks:
        file_path = settings.BGM_DIR / f"{tid}.mp3"
        if not file_path.exists():
            video_engine.generate_ambient_bgm(str(file_path), duration=dur)
        results.append(
            BgmItem(
                id=tid,
                name=name,
                category=cat,
                duration=dur,
                file_path=str(file_path),
                preview_url=f"/media/bgm/{tid}.mp3"
            )
        )
    return results

@router.get("/bgm/{track_id}.mp3")
async def get_bgm_file(track_id: str):
    """Streams a BGM audio file."""
    file_path = settings.BGM_DIR / f"{track_id}.mp3"
    if not file_path.exists():
        video_engine.generate_ambient_bgm(str(file_path), duration=60.0)
    return FileResponse(str(file_path), media_type="audio/mpeg")

@router.post("/upload")
async def upload_custom_media(file: UploadFile = File(...)):
    """Uploads custom media (video, image, audio) for custom scenes."""
    file_id = str(uuid.uuid4())
    ext = Path(file.filename or "media.mp4").suffix or ".mp4"
    dest_path = settings.STORAGE_DIR / "uploads" / f"{file_id}{ext}"
    dest_path.parent.mkdir(parents=True, exist_ok=True)

    try:
        with open(dest_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        return {
            "status": "success",
            "file_id": file_id,
            "filename": file.filename,
            "path": str(dest_path),
            "url": f"/uploads/{file_id}{ext}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")
