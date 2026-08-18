import os
import shutil
from pathlib import Path
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # App Information
    APP_NAME: str = "ShortsMania API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    PORT: int = 8000
    HOST: str = "0.0.0.0"

    # API Keys
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    PEXELS_API_KEY: str = os.getenv("PEXELS_API_KEY", "")
    PIXABAY_API_KEY: str = os.getenv("PIXABAY_API_KEY", "")
    ELEVENLABS_API_KEY: str = os.getenv("ELEVENLABS_API_KEY", "")

    # Directory Paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    STORAGE_DIR: Path = BASE_DIR / "storage"
    TASKS_DIR: Path = STORAGE_DIR / "tasks"
    OUTPUT_DIR: Path = STORAGE_DIR / "outputs"
    TEMP_DIR: Path = STORAGE_DIR / "temp"
    RESOURCES_DIR: Path = BASE_DIR / "app" / "resources"
    FONTS_DIR: Path = RESOURCES_DIR / "fonts"
    BGM_DIR: Path = RESOURCES_DIR / "bgm"

    # Video Settings
    DEFAULT_FPS: int = 30
    DEFAULT_RESOLUTION_VERTICAL: tuple = (1080, 1920)
    DEFAULT_RESOLUTION_HORIZONTAL: tuple = (1920, 1080)

    # FFmpeg Binary Locator
    FFMPEG_PATH: str = ""
    FFPROBE_PATH: str = ""

    def find_ffmpeg(self) -> str:
        if self.FFMPEG_PATH and os.path.exists(self.FFMPEG_PATH):
            return self.FFMPEG_PATH

        # 1. Check system PATH
        path_ffmpeg = shutil.which("ffmpeg")
        if path_ffmpeg:
            self.FFMPEG_PATH = path_ffmpeg
            return path_ffmpeg

        # 2. Check common Windows paths
        candidates = [
            r"C:\KMPlayer\ffmpeg.exe",
            r"C:\ffmpeg\bin\ffmpeg.exe",
            r"C:\Program Files\ffmpeg\bin\ffmpeg.exe",
            r"C:\shortsmania\ffmpeg\bin\ffmpeg.exe",
            os.path.expanduser(r"~\AppData\Local\Programs\ffmpeg\bin\ffmpeg.exe"),
        ]
        for candidate in candidates:
            if os.path.exists(candidate):
                self.FFMPEG_PATH = candidate
                return candidate

        return "ffmpeg"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()

# Ensure directories exist
for path in [settings.STORAGE_DIR, settings.TASKS_DIR, settings.OUTPUT_DIR, settings.TEMP_DIR, settings.FONTS_DIR, settings.BGM_DIR]:
    path.mkdir(parents=True, exist_ok=True)

# Find FFmpeg binary
settings.find_ffmpeg()
