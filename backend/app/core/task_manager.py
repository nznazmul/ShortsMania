import asyncio
import json
import os
from datetime import datetime
from typing import Dict, List, Optional, Set, Callable
from pathlib import Path

from app.core.config import settings
from app.core.logger import logger
from app.models.schemas import TaskProgress, TaskStageType, TaskStatusType, TaskLogEntry, ScriptData

class TaskManager:
    """In-memory and file-persisted task queue manager with WebSocket/SSE event broadcasting."""

    def __init__(self):
        self.tasks: Dict[str, TaskProgress] = {}
        self.listeners: Dict[str, Set[asyncio.Queue]] = {}
        self._lock = asyncio.Lock()
        self._load_existing_tasks()

    def _load_existing_tasks(self):
        """Loads previous task records from storage directory."""
        if not settings.TASKS_DIR.exists():
            return
        for task_dir in settings.TASKS_DIR.iterdir():
            if task_dir.is_dir():
                meta_file = task_dir / "metadata.json"
                if meta_file.exists():
                    try:
                        with open(meta_file, "r", encoding="utf-8") as f:
                            data = json.load(f)
                            task = TaskProgress(**data)
                            self.tasks[task.task_id] = task
                    except Exception as e:
                        logger.warning(f"Failed to load task from {meta_file}: {e}")

    def _save_task(self, task: TaskProgress):
        """Persists task metadata to disk."""
        task_dir = settings.TASKS_DIR / task.task_id
        task_dir.mkdir(parents=True, exist_ok=True)
        meta_file = task_dir / "metadata.json"
        try:
            with open(meta_file, "w", encoding="utf-8") as f:
                json.dump(task.dict(), f, indent=2, ensure_ascii=False)
        except Exception as e:
            logger.error(f"Error saving task {task.task_id}: {e}")

    def create_task(self, task_id: str, title: str = "Generating Video...", video_aspect: str = "9:16") -> TaskProgress:
        task = TaskProgress(
            task_id=task_id,
            status="pending",
            stage="initializing",
            progress=0,
            message="Task initialized",
            title=title,
            video_aspect=video_aspect,
            created_at=datetime.utcnow().isoformat(),
            updated_at=datetime.utcnow().isoformat(),
            logs=[
                TaskLogEntry(
                    timestamp=datetime.utcnow().strftime("%H:%M:%S"),
                    stage="initializing",
                    message="Video generation job initialized",
                    level="info"
                )
            ]
        )
        self.tasks[task_id] = task
        self._save_task(task)
        return task

    def get_task(self, task_id: str) -> Optional[TaskProgress]:
        return self.tasks.get(task_id)

    def list_tasks(self) -> List[TaskProgress]:
        # Return sorted by created_at descending
        return sorted(self.tasks.values(), key=lambda t: t.created_at, reverse=True)

    def delete_task(self, task_id: str) -> bool:
        if task_id in self.tasks:
            del self.tasks[task_id]
            task_dir = settings.TASKS_DIR / task_id
            if task_dir.exists():
                import shutil
                shutil.rmtree(task_dir, ignore_errors=True)
            return True
        return False

    async def update_stage(
        self,
        task_id: str,
        stage: TaskStageType,
        progress: int,
        message: str,
        script: Optional[ScriptData] = None,
        level: str = "info"
    ):
        task = self.tasks.get(task_id)
        if not task:
            return

        task.stage = stage
        task.progress = min(max(progress, 0), 100)
        task.message = message
        task.status = "processing"
        task.updated_at = datetime.utcnow().isoformat()
        if script:
            task.script = script
            task.title = script.title

        log_entry = TaskLogEntry(
            timestamp=datetime.utcnow().strftime("%H:%M:%S"),
            stage=stage,
            message=message,
            level=level
        )
        task.logs.append(log_entry)
        self._save_task(task)
        await self._broadcast(task_id, task)

    async def add_log(self, task_id: str, message: str, stage: Optional[TaskStageType] = None, level: str = "info"):
        task = self.tasks.get(task_id)
        if not task:
            return

        active_stage = stage or task.stage
        log_entry = TaskLogEntry(
            timestamp=datetime.utcnow().strftime("%H:%M:%S"),
            stage=active_stage,
            message=message,
            level=level
        )
        task.logs.append(log_entry)
        task.updated_at = datetime.utcnow().isoformat()
        self._save_task(task)
        await self._broadcast(task_id, task)

    async def complete_task(
        self,
        task_id: str,
        video_url: str,
        thumbnail_url: Optional[str] = None,
        duration: Optional[float] = None
    ):
        task = self.tasks.get(task_id)
        if not task:
            return

        task.status = "completed"
        task.stage = "completed"
        task.progress = 100
        task.message = "Video generated successfully!"
        task.video_url = video_url
        task.thumbnail_url = thumbnail_url
        task.video_duration = duration
        task.updated_at = datetime.utcnow().isoformat()

        log_entry = TaskLogEntry(
            timestamp=datetime.utcnow().strftime("%H:%M:%S"),
            stage="completed",
            message="Final MP4 video rendering completed.",
            level="success"
        )
        task.logs.append(log_entry)
        self._save_task(task)
        await self._broadcast(task_id, task)

    async def fail_task(self, task_id: str, error_message: str):
        task = self.tasks.get(task_id)
        if not task:
            return

        task.status = "failed"
        task.stage = "failed"
        task.error = error_message
        task.message = f"Error: {error_message}"
        task.updated_at = datetime.utcnow().isoformat()

        log_entry = TaskLogEntry(
            timestamp=datetime.utcnow().strftime("%H:%M:%S"),
            stage="failed",
            message=f"Pipeline failed: {error_message}",
            level="error"
        )
        task.logs.append(log_entry)
        self._save_task(task)
        await self._broadcast(task_id, task)

    async def subscribe(self, task_id: str) -> asyncio.Queue:
        queue = asyncio.Queue()
        async with self._lock:
            if task_id not in self.listeners:
                self.listeners[task_id] = set()
            self.listeners[task_id].add(queue)
        return queue

    async def unsubscribe(self, task_id: str, queue: asyncio.Queue):
        async with self._lock:
            if task_id in self.listeners and queue in self.listeners[task_id]:
                self.listeners[task_id].remove(queue)
                if not self.listeners[task_id]:
                    del self.listeners[task_id]

    async def _broadcast(self, task_id: str, task: TaskProgress):
        if task_id not in self.listeners:
            return
        payload = json.dumps(task.dict(), ensure_ascii=False)
        dead_queues = []
        for queue in list(self.listeners[task_id]):
            try:
                queue.put_nowait(payload)
            except Exception:
                dead_queues.append(queue)
        for dead in dead_queues:
            self.listeners[task_id].discard(dead)

task_manager = TaskManager()
