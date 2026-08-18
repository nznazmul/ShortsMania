# 🚀 ShortsMania (Turbo Full-Stack Edition)

> **AI-Powered Automated Short Video Generator Web Application**
> Build viral, high-retention videos for **TikTok, YouTube Shorts, and Instagram Reels** with automated scriptwriting, neural voice synthesis, stock footage matching, and styled karaoke typography.

---

## ✨ System Features

- ⚡ **Multi-Step Creation Wizard**:
  - **Step 1: Concept & Format**: Topic input, AI prompt enhancer pills, 9:16 vertical vs 16:9 widescreen toggle, 15s/30s/60s durations, tones (Viral, Educational, Storytelling, Humorous, Motivational, Tech, Finance).
  - **Step 2: AI Script Studio**: Editable scene-by-scene narration cards, visual keyword tags per scene, duration sliders, word count and audio time estimation.
  - **Step 3: Neural Voiceover & BGM**: High-fidelity Edge-TTS voices with instant audition preview, speech rate/pitch adjustment, background music library with automatic audio ducking.
  - **Step 4: Subtitles & Visual Styling**: Live interactive typography preview canvas, font family selector, custom colors, animation presets (Karaoke Word Highlight, Pop Bounce, Clean Bottom, Boxed Badge), and stock footage provider (Pexels, Pixabay, Fallback Canvas).
- 🔄 **Real-Time 5-Stage Task Pipeline**:
  - `[1/5 Script]` -> `[2/5 Voiceover]` -> `[3/5 Footage]` -> `[4/5 Subtitles]` -> `[5/5 Render]`
  - Dual WebSocket & Server-Sent Events (SSE) live progress updates with embedded terminal log drawer.
- 🎬 **Video Studio Player & Export**:
  - Built-in HTML5 Video Player supporting 9:16 and 16:9 aspect ratios.
  - Interactive timeline seek bar, playback speed toggle, volume slider, script transcript inspector, and 1-click MP4 download.
- ⚙️ **Settings & Diagnostics**:
  - API key management for Google Gemini, OpenAI, Pexels, and ElevenLabs with real-time test connectivity.
  - Out-of-the-box offline fallback engines for keyless testing.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router, React 19, TypeScript), Tailwind CSS, Lucide Icons, Framer Motion.
- **Backend**: FastAPI (Python 3.11+) with Async/Await background task pipeline, WebSockets, and Server-Sent Events.
- **Video Engine**: FFmpeg with `libass` subtitle burning, `amix` audio ducking, scaling and fast H.264 MP4 encoding.
- **AI Pipelines**:
  - Scriptwriting: Google Gemini 2.5 Flash / OpenAI GPT-4o / Built-in Smart AI Engine.
  - Text-to-Speech: Edge-TTS Neural (Free, Multi-lingual) / ElevenLabs.
  - Media Sourcing: Pexels API / Pixabay API / Dynamic Procedural Motion Canvas.

---

## 🚀 Quick Start Guide

### 1. Backend Setup

```bash
cd backend
# Create and activate virtual environment (or use pyenv)
python -m venv venv
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run backend server
python run.py
```
> Backend runs at: `http://localhost:8000` (API Docs at `http://localhost:8000/docs`)

### 2. Frontend Setup

```bash
cd frontend
# Install dependencies
npm install

# Run frontend development server
npm run dev
```
> Frontend web app runs at: `http://localhost:3000`

### 3. Docker Deployment (Single Command)

```bash
docker-compose up --build
```

---

## 📁 Directory Structure

```
shortsmania/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI Application Entry
│   │   ├── core/                    # Settings, Logger, TaskManager
│   │   ├── models/                  # Pydantic Schemas & Types
│   │   ├── services/                # LLM, TTS, Media, Subtitles, VideoEngine
│   │   ├── api/v1/                  # Tasks, LLM, Media, Settings Routes
│   │   └── resources/               # BGM tracks & Fonts
│   ├── tests/                       # Pytest Suite
│   ├── requirements.txt
│   └── run.py
├── frontend/
│   ├── src/
│   │   ├── app/                     # App Router (Dashboard, Create, Videos, History, Settings)
│   │   ├── components/              # Stepper, VideoPlayer, LogTerminal, Navbar
│   │   ├── lib/                     # Typed API Client & Utilities
│   │   └── hooks/                   # useTaskProgress Hook
│   ├── package.json
│   └── tailwind.config.ts
├── docker-compose.yml
├── Dockerfile.backend
├── Dockerfile.frontend
└── README.md
```
