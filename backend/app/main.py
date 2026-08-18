import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.logger import logger
from app.api.v1.router import api_router

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="ShortsMania: High-Performance AI-Powered Short Video Generator Backend"
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure directories exist
settings.OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
(settings.STORAGE_DIR / "uploads").mkdir(parents=True, exist_ok=True)

# Mount static video serving directory
app.mount("/videos", StaticFiles(directory=str(settings.OUTPUT_DIR)), name="videos")
app.mount("/uploads", StaticFiles(directory=str(settings.STORAGE_DIR / "uploads")), name="uploads")

# Include API Router
app.include_router(api_router, prefix="/api")

@app.get("/")
async def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "online",
        "ffmpeg": settings.find_ffmpeg()
    }

@app.get("/ping")
async def ping():
    return {"status": "pong"}

@app.on_event("startup")
async def on_startup():
    ffmpeg_path = settings.find_ffmpeg()
    logger.info(f"ShortsMania Backend started! FFmpeg path: {ffmpeg_path}")
