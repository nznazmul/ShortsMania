import pytest
import asyncio
import os
from pathlib import Path
from app.models.schemas import SubtitleStyle, ScriptToneType, GenerateVideoRequest
from app.services.llm_service import llm_service
from app.services.tts_service import tts_service
from app.services.media_service import media_service
from app.services.subtitle_service import subtitle_service
from app.services.video_engine import video_engine
from app.core.config import settings
from app.api.v1.tasks import run_video_generation_pipeline
from app.core.task_manager import task_manager

@pytest.mark.asyncio
async def test_llm_service_fallback():
    script = await llm_service.generate_script(
        prompt="3 Incredible Facts About Saturn",
        tone="Viral",
        duration=15,
        language="English"
    )
    assert script is not None
    assert len(script.scenes) >= 3
    assert script.scenes[0].narration != ""
    assert len(script.scenes[0].visual_keywords) > 0
    print(f"Generated script title: {script.title}, scenes: {len(script.scenes)}")

@pytest.mark.asyncio
async def test_tts_service():
    test_audio = str(settings.TEMP_DIR / "test_tts.mp3")
    path, timings = await tts_service.synthesize_speech(
        text="Testing automated speech generation for ShortsMania.",
        output_audio_path=test_audio,
        voice="en-US-ChristopherNeural"
    )
    assert os.path.exists(path)
    assert os.path.getsize(path) > 100
    duration = tts_service.get_audio_duration(path)
    assert duration > 1.0
    print(f"Synthesized TTS audio: {duration:.2f}s, timings count: {len(timings)}")

def test_media_service_procedural():
    test_clip = str(settings.TEMP_DIR / "test_procedural.mp4")
    res_path = media_service._generate_procedural_background(
        duration=2.0,
        aspect="9:16",
        output_path=test_clip,
        seed=1
    )
    assert os.path.exists(res_path)
    assert os.path.getsize(res_path) > 1000
    print(f"Generated procedural clip: {res_path} ({os.path.getsize(res_path)} bytes)")

def test_subtitle_service():
    test_ass = str(settings.TEMP_DIR / "test_subs.ass")
    style = SubtitleStyle(
        font_name="Arial",
        font_size=28,
        primary_color="#FFFFFF",
        highlight_color="#FFD700",
        animation="karaoke_word"
    )
    mock_timings = [
        {"text": "ShortsMania", "start": 0.0, "duration": 0.5, "end": 0.5},
        {"text": "AI", "start": 0.5, "duration": 0.3, "end": 0.8},
        {"text": "Video", "start": 0.8, "duration": 0.4, "end": 1.2},
        {"text": "Generator", "start": 1.2, "duration": 0.6, "end": 1.8},
    ]
    res_ass = subtitle_service.generate_ass_subtitles(
        word_timings=mock_timings,
        full_text="ShortsMania AI Video Generator",
        total_duration=2.0,
        style=style,
        output_ass_path=test_ass,
        video_width=1080,
        video_height=1920
    )
    assert os.path.exists(res_ass)
    with open(res_ass, "r", encoding="utf-8") as f:
        content = f.read()
    assert "PlayResX: 1080" in content
    assert "Dialogue:" in content
    print("Subtitle ASS generated successfully.")

@pytest.mark.asyncio
async def test_full_pipeline_run():
    task_id = "test-pipeline-task"
    task = task_manager.create_task(task_id=task_id, title="Test Pipeline Video", video_aspect="9:16")
    req = GenerateVideoRequest(
        prompt="Why The Deep Ocean Is Terrifying",
        video_aspect="9:16",
        video_length=15,
        script_tone="Viral",
        voice_name="en-US-ChristopherNeural",
        voice_rate=1.0,
        voice_pitch=0,
        bgm_volume=0.2,
        subtitle_style=SubtitleStyle(
            font_name="Arial",
            font_size=28,
            primary_color="#FFFFFF",
            highlight_color="#FFD700",
            animation="karaoke_word"
        )
    )
    await run_video_generation_pipeline(task_id, req)
    completed_task = task_manager.get_task(task_id)
    assert completed_task is not None
    assert completed_task.status == "completed"
    assert completed_task.video_url is not None
    assert os.path.exists(str(settings.OUTPUT_DIR / f"{task_id}.mp4"))
    print(f"End-to-end video generation succeeded! Output: {completed_task.video_url}")
