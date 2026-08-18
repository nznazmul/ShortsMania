from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field
from datetime import datetime

# Enums and Literal types
VideoAspectType = Literal["9:16", "16:9", "1:1"]
ScriptToneType = Literal["Educational", "Viral", "Storytelling", "Humorous", "Motivational", "Tech", "Finance"]
FootageSourceType = Literal["pexels", "pixabay", "procedural", "custom"]
TaskStatusType = Literal["pending", "processing", "completed", "failed", "cancelled"]
TaskStageType = Literal[
    "initializing",
    "generating_script",
    "synthesizing_audio",
    "fetching_footage",
    "syncing_captions",
    "rendering_video",
    "completed",
    "failed"
]

class SubtitleStyle(BaseModel):
    font_name: str = Field(default="Arial", description="Font family name")
    font_size: int = Field(default=28, description="Font size in pt")
    primary_color: str = Field(default="#FFFFFF", description="Primary subtitle text color (Hex)")
    highlight_color: str = Field(default="#FFD700", description="Active word karaoke highlight color (Hex)")
    outline_color: str = Field(default="#000000", description="Outline border color (Hex)")
    outline_width: int = Field(default=2, description="Outline stroke thickness")
    shadow_color: str = Field(default="#000000", description="Shadow drop color (Hex)")
    position: Literal["bottom", "center", "top"] = Field(default="bottom", description="Vertical position")
    animation: Literal["karaoke_word", "pop_in", "clean_bottom", "boxed"] = Field(
        default="karaoke_word",
        description="Animation style for subtitles"
    )

class SceneItem(BaseModel):
    index: int = Field(default=1, description="Scene sequence number")
    narration: str = Field(default="", description="Spoken narration for this scene")
    visual_keywords: List[str] = Field(default_factory=list, description="Search terms for stock footage")
    duration: float = Field(default=4.0, description="Estimated duration in seconds")
    media_url: Optional[str] = Field(default=None, description="Source video or image URL")
    media_path: Optional[str] = Field(default=None, description="Local cached media file path")

class ScriptData(BaseModel):
    title: str = Field(default="Untitled Video")
    scenes: List[SceneItem] = Field(default_factory=list)
    total_estimated_duration: float = Field(default=30.0)
    tags: List[str] = Field(default_factory=list)
    tone: ScriptToneType = "Viral"
    language: str = "English"

class GenerateVideoRequest(BaseModel):
    prompt: str = Field(default="", description="Topic or prompt for video")
    video_aspect: VideoAspectType = Field(default="9:16", description="Aspect ratio: 9:16 vertical or 16:9 horizontal")
    video_length: int = Field(default=30, description="Target duration in seconds (15, 30, 60)")
    script_tone: ScriptToneType = Field(default="Viral", description="Tone of script")
    language: str = Field(default="English", description="Target spoken language")
    voice_name: str = Field(default="en-US-ChristopherNeural", description="TTS voice identifier")
    voice_rate: float = Field(default=1.0, ge=0.5, le=2.0, description="Speech rate multiplier")
    voice_pitch: int = Field(default=0, ge=-50, le=50, description="Speech pitch adjustment (Hz)")
    bgm_type: str = Field(default="cinematic", description="Background music theme or track ID")
    bgm_volume: float = Field(default=0.18, ge=0.0, le=1.0, description="Background music volume")
    subtitle_style: SubtitleStyle = Field(default_factory=SubtitleStyle)
    custom_script: Optional[str] = Field(default=None, description="User provided custom script text")
    scenes: Optional[List[SceneItem]] = Field(default=None, description="Pre-edited scenes if already generated")
    footage_source: FootageSourceType = Field(default="pexels", description="Footage provider")

class ScriptGenerateRequest(BaseModel):
    prompt: str = Field(..., description="Topic or theme for script generation")
    tone: ScriptToneType = Field(default="Viral")
    duration: int = Field(default=30, ge=10, le=120)
    language: str = Field(default="English")

class TaskLogEntry(BaseModel):
    timestamp: str
    stage: TaskStageType
    message: str
    level: Literal["info", "warning", "error", "success"] = "info"

class TaskProgress(BaseModel):
    task_id: str
    status: TaskStatusType = "pending"
    stage: TaskStageType = "initializing"
    progress: int = Field(default=0, ge=0, le=100)
    message: str = "Task queued"
    error: Optional[str] = None
    video_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    video_duration: Optional[float] = None
    video_aspect: VideoAspectType = "9:16"
    title: str = "Generating Video..."
    script: Optional[ScriptData] = None
    logs: List[TaskLogEntry] = Field(default_factory=list)
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

class VoiceItem(BaseModel):
    id: str
    name: str
    language: str
    gender: str
    locale: str
    provider: Literal["edge-tts", "elevenlabs", "system"] = "edge-tts"
    preview_url: Optional[str] = None

class BgmItem(BaseModel):
    id: str
    name: str
    category: str
    duration: float
    file_path: str
    preview_url: str

class SettingsSchema(BaseModel):
    gemini_api_key_set: bool = False
    openai_api_key_set: bool = False
    pexels_api_key_set: bool = False
    pixabay_api_key_set: bool = False
    elevenlabs_api_key_set: bool = False
    default_aspect: VideoAspectType = "9:16"
    default_voice: str = "en-US-ChristopherNeural"
    ffmpeg_detected: bool = False
    ffmpeg_path: str = ""

class SettingsUpdateRequest(BaseModel):
    gemini_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None
    pexels_api_key: Optional[str] = None
    pixabay_api_key: Optional[str] = None
    elevenlabs_api_key: Optional[str] = None
