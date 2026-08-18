import asyncio
import os
import uuid
import json
from typing import List, Optional
from fastapi import APIRouter, HTTPException, BackgroundTasks, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse

from app.core.config import settings
from app.core.logger import logger
from app.core.task_manager import task_manager
from app.models.schemas import GenerateVideoRequest, TaskProgress, ScriptData, SceneItem
from app.services.llm_service import llm_service
from app.services.tts_service import tts_service
from app.services.media_service import media_service
from app.services.subtitle_service import subtitle_service
from app.services.video_engine import video_engine

router = APIRouter(prefix="/tasks", tags=["tasks"])

async def run_video_generation_pipeline(task_id: str, request: GenerateVideoRequest):
    """
    Executes the 5-stage automated video generation pipeline:
    [1/5 Generating Script] -> [2/5 Synthesizing Audio] -> [3/5 Fetching Footage] -> [4/5 Syncing Captions] -> [5/5 Rendering Video]
    """
    task_dir = settings.TASKS_DIR / task_id
    task_dir.mkdir(parents=True, exist_ok=True)

    try:
        # ==========================================
        # STAGE 1: SCRIPT GENERATION
        # ==========================================
        await task_manager.update_stage(
            task_id,
            stage="generating_script",
            progress=10,
            message="[1/5] Generating script and scene breakdown..."
        )

        script: ScriptData
        if request.scenes and len(request.scenes) > 0:
            # User already customized scenes in wizard
            script = ScriptData(
                title=request.prompt or "Custom Short Video",
                scenes=request.scenes,
                total_estimated_duration=float(request.video_length),
                tone=request.script_tone,
                language=request.language
            )
            await task_manager.add_log(task_id, f"Using user-defined {len(script.scenes)} scenes.")
        elif request.custom_script:
            # User provided raw script text - split into scenes
            lines = [l.strip() for l in request.custom_script.split("\n") if l.strip()]
            scenes = []
            dur_per_scene = request.video_length / max(len(lines), 1)
            for i, line in enumerate(lines):
                scenes.append(SceneItem(
                    index=i + 1,
                    narration=line,
                    visual_keywords=[request.prompt or "abstract", "cinematic"],
                    duration=dur_per_scene
                ))
            script = ScriptData(
                title=request.prompt or "Custom Script Video",
                scenes=scenes,
                total_estimated_duration=float(request.video_length),
                tone=request.script_tone,
                language=request.language
            )
            await task_manager.add_log(task_id, f"Parsed custom script into {len(scenes)} scenes.")
        else:
            # Generate via LLM / Fallback
            script = await llm_service.generate_script(
                prompt=request.prompt,
                tone=request.script_tone,
                duration=request.video_length,
                language=request.language
            )
            await task_manager.add_log(task_id, f"Generated script: '{script.title}' with {len(script.scenes)} scenes.")

        await task_manager.update_stage(
            task_id,
            stage="generating_script",
            progress=20,
            message=f"Script created: '{script.title}' ({len(script.scenes)} scenes)",
            script=script
        )

        # Combine narration for speech synthesis
        full_narration = " ".join([s.narration for s in script.scenes]).strip()
        if not full_narration:
            full_narration = f"Here is what you need to know about {request.prompt}."

        # ==========================================
        # STAGE 2: VOICE & AUDIO SYNTHESIS
        # ==========================================
        await task_manager.update_stage(
            task_id,
            stage="synthesizing_audio",
            progress=30,
            message="[2/5] Synthesizing neural voiceover & word timestamps..."
        )

        audio_path = str(task_dir / "narration.mp3")
        _, word_timings = await tts_service.synthesize_speech(
            text=full_narration,
            output_audio_path=audio_path,
            voice=request.voice_name,
            rate=request.voice_rate,
            pitch=request.voice_pitch
        )

        actual_audio_duration = tts_service.get_audio_duration(audio_path)
        await task_manager.add_log(
            task_id,
            f"Voiceover synthesized ({actual_audio_duration:.1f}s, {len(word_timings)} word timestamps captured)."
        )

        await task_manager.update_stage(
            task_id,
            stage="synthesizing_audio",
            progress=40,
            message=f"Audio synthesized successfully ({actual_audio_duration:.1f}s)"
        )

        # Distribute scene durations proportionally based on narration text length
        total_chars = sum(len(s.narration) for s in script.scenes) or 1
        for s in script.scenes:
            prop = len(s.narration) / total_chars
            s.duration = max(round(prop * actual_audio_duration, 1), 2.0)

        # ==========================================
        # STAGE 3: FOOTAGE SOURCING & NORMALIZATION
        # ==========================================
        await task_manager.update_stage(
            task_id,
            stage="fetching_footage",
            progress=50,
            message="[3/5] Sourcing and normalizing HD footage per scene..."
        )

        scene_clip_paths = []
        for i, scene in enumerate(script.scenes):
            raw_footage_path = str(task_dir / f"scene_{i+1}_raw.mp4")
            norm_clip_path = str(task_dir / f"scene_{i+1}_norm.mp4")

            await task_manager.add_log(
                task_id,
                f"Scene {i+1}/{len(script.scenes)}: Sourcing footage for keywords {scene.visual_keywords}"
            )

            # Sourcing footage (Pexels / Pixabay / Procedural)
            await media_service.fetch_scene_footage(
                keywords=scene.visual_keywords,
                duration=scene.duration,
                aspect=request.video_aspect,
                output_path=raw_footage_path,
                scene_index=i + 1
            )

            # Normalizing resolution & cropping
            video_engine.normalize_scene_clip(
                input_video_path=raw_footage_path,
                output_clip_path=norm_clip_path,
                duration=scene.duration,
                aspect=request.video_aspect
            )
            scene_clip_paths.append(norm_clip_path)

            progress_val = 50 + int((i + 1) / len(script.scenes) * 15)
            await task_manager.update_stage(
                task_id,
                stage="fetching_footage",
                progress=progress_val,
                message=f"Scene {i+1}/{len(script.scenes)} footage ready"
            )

        # ==========================================
        # STAGE 4: SUBTITLE GENERATION & STYLING
        # ==========================================
        await task_manager.update_stage(
            task_id,
            stage="syncing_captions",
            progress=70,
            message="[4/5] Generating styled ASS typography and karaoke captions..."
        )

        width, height = (1080, 1920) if request.video_aspect == "9:16" else (1920, 1080)
        ass_path = str(task_dir / "subtitles.ass")
        subtitle_service.generate_ass_subtitles(
            word_timings=word_timings,
            full_text=full_narration,
            total_duration=actual_audio_duration,
            style=request.subtitle_style,
            output_ass_path=ass_path,
            video_width=width,
            video_height=height
        )

        await task_manager.add_log(
            task_id,
            f"Subtitles compiled (Style: {request.subtitle_style.animation}, Font: {request.subtitle_style.font_name})."
        )

        await task_manager.update_stage(
            task_id,
            stage="syncing_captions",
            progress=80,
            message="Captions synchronized with audio"
        )

        # ==========================================
        # STAGE 5: VIDEO COMPOSITION & ENCODING
        # ==========================================
        await task_manager.update_stage(
            task_id,
            stage="rendering_video",
            progress=85,
            message="[5/5] Compositing final MP4 with audio ducking and subtitle burn..."
        )

        concat_video_path = str(task_dir / "concatenated.mp4")
        video_engine.concatenate_clips(scene_clip_paths, concat_video_path)

        final_filename = f"{task_id}.mp4"
        final_video_path = str(settings.OUTPUT_DIR / final_filename)
        thumb_filename = f"{task_id}.jpg"
        thumb_path = str(settings.OUTPUT_DIR / thumb_filename)

        video_engine.render_final_video(
            concatenated_video_path=concat_video_path,
            narration_audio_path=audio_path,
            ass_subtitle_path=ass_path,
            output_final_path=final_video_path,
            bgm_volume=request.bgm_volume,
            total_duration=actual_audio_duration
        )

        # Extract thumbnail
        video_engine.extract_thumbnail(final_video_path, thumb_path)

        video_url = f"/videos/{final_filename}"
        thumb_url = f"/videos/{thumb_filename}"

        await task_manager.complete_task(
            task_id=task_id,
            video_url=video_url,
            thumbnail_url=thumb_url,
            duration=actual_audio_duration
        )
        logger.info(f"Task {task_id} completed successfully! Output: {video_url}")

    except Exception as e:
        logger.exception(f"Pipeline error for task {task_id}: {e}")
        await task_manager.fail_task(task_id, str(e))

@router.post("/generate", response_model=TaskProgress)
async def generate_video(request: GenerateVideoRequest, background_tasks: BackgroundTasks):
    """Initiates an automated video creation task."""
    task_id = str(uuid.uuid4())
    task_title = request.prompt or (request.scenes[0].narration[:30] if request.scenes else "AI Short Video")
    task = task_manager.create_task(
        task_id=task_id,
        title=task_title,
        video_aspect=request.video_aspect
    )

    # Launch background task
    background_tasks.add_task(run_video_generation_pipeline, task_id, request)
    return task

@router.get("", response_model=List[TaskProgress])
async def list_tasks():
    """Returns list of all video generation tasks."""
    return task_manager.list_tasks()

@router.get("/{task_id}", response_model=TaskProgress)
async def get_task(task_id: str):
    """Retrieves current state and logs for a task."""
    task = task_manager.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@router.delete("/{task_id}")
async def delete_task(task_id: str):
    """Deletes a task and its stored media files."""
    deleted = task_manager.delete_task(task_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"status": "success", "message": f"Task {task_id} deleted"}

@router.get("/{task_id}/events")
async def task_events_sse(task_id: str):
    """Server-Sent Events (SSE) stream for real-time progress updates."""
    task = task_manager.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    queue = await task_manager.subscribe(task_id)

    async def event_generator():
        try:
            # Yield initial state
            yield f"data: {json.dumps(task.dict(), ensure_ascii=False)}\n\n"
            while True:
                data = await queue.get()
                yield f"data: {data}\n\n"
        except asyncio.CancelledError:
            pass
        finally:
            await task_manager.unsubscribe(task_id, queue)

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@router.websocket("/{task_id}/ws")
async def task_websocket(websocket: WebSocket, task_id: str):
    """WebSocket endpoint for real-time live streaming of pipeline events and terminal logs."""
    task = task_manager.get_task(task_id)
    if not task:
        await websocket.close(code=4004, reason="Task not found")
        return

    await websocket.accept()
    queue = await task_manager.subscribe(task_id)

    try:
        # Send initial state
        await websocket.send_text(json.dumps(task.dict(), ensure_ascii=False))

        async def send_updates():
            while True:
                data = await queue.get()
                await websocket.send_text(data)

        async def receive_pings():
            while True:
                msg = await websocket.receive_text()
                if msg == "ping":
                    await websocket.send_text("pong")

        await asyncio.gather(send_updates(), receive_pings())

    except (WebSocketDisconnect, asyncio.CancelledError):
        pass
    finally:
        await task_manager.unsubscribe(task_id, queue)
