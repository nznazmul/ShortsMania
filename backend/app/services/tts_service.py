import asyncio
import os
import subprocess
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
import edge_tts
import httpx

from app.core.config import settings
from app.core.logger import logger
from app.models.schemas import VoiceItem

class TTSService:
    """Text-to-Speech synthesis service supporting Edge-TTS and ElevenLabs."""

    POPULAR_VOICES: List[VoiceItem] = [
        VoiceItem(id="en-US-ChristopherNeural", name="Christopher (Male - Authoritative / Deep)", language="English (US)", gender="Male", locale="en-US", provider="edge-tts"),
        VoiceItem(id="en-US-JennyNeural", name="Jenny (Female - Natural / Friendly)", language="English (US)", gender="Female", locale="en-US", provider="edge-tts"),
        VoiceItem(id="en-US-GuyNeural", name="Guy (Male - Casual / Conversational)", language="English (US)", gender="Male", locale="en-US", provider="edge-tts"),
        VoiceItem(id="en-US-AriaNeural", name="Aria (Female - Clear / News Anchor)", language="English (US)", gender="Female", locale="en-US", provider="edge-tts"),
        VoiceItem(id="en-GB-RyanNeural", name="Ryan (Male - British Accent)", language="English (UK)", gender="Male", locale="en-GB", provider="edge-tts"),
        VoiceItem(id="en-GB-SoniaNeural", name="Sonia (Female - British Accent)", language="English (UK)", gender="Female", locale="en-GB", provider="edge-tts"),
        VoiceItem(id="en-AU-WilliamNeural", name="William (Male - Australian Accent)", language="English (AU)", gender="Male", locale="en-AU", provider="edge-tts"),
        VoiceItem(id="es-ES-AlvaroNeural", name="Alvaro (Male - Spanish)", language="Spanish (Spain)", gender="Male", locale="es-ES", provider="edge-tts"),
        VoiceItem(id="fr-FR-HenriNeural", name="Henri (Male - French)", language="French (France)", gender="Male", locale="fr-FR", provider="edge-tts"),
        VoiceItem(id="de-DE-ConradNeural", name="Conrad (Male - German)", language="German (Germany)", gender="Male", locale="de-DE", provider="edge-tts"),
        VoiceItem(id="hi-IN-MadhurNeural", name="Madhur (Male - Hindi)", language="Hindi (India)", gender="Male", locale="hi-IN", provider="edge-tts"),
        VoiceItem(id="zh-CN-YunxiNeural", name="Yunxi (Male - Chinese)", language="Chinese (Mandarin)", gender="Male", locale="zh-CN", provider="edge-tts"),
        VoiceItem(id="ja-JP-KeitaNeural", name="Keita (Male - Japanese)", language="Japanese", gender="Male", locale="ja-JP", provider="edge-tts"),
    ]

    def __init__(self):
        self.elevenlabs_key = settings.ELEVENLABS_API_KEY

    def update_key(self, elevenlabs_key: Optional[str] = None):
        if elevenlabs_key is not None:
            self.elevenlabs_key = elevenlabs_key

    def get_available_voices(self) -> List[VoiceItem]:
        voices = list(self.POPULAR_VOICES)
        if self.elevenlabs_key:
            voices.append(
                VoiceItem(
                    id="elevenlabs_adam",
                    name="ElevenLabs Adam (Premium Narrative)",
                    language="English",
                    gender="Male",
                    locale="en-US",
                    provider="elevenlabs"
                )
            )
        return voices

    async def synthesize_speech(
        self,
        text: str,
        output_audio_path: str,
        voice: str = "en-US-ChristopherNeural",
        rate: float = 1.0,
        pitch: int = 0
    ) -> Tuple[str, List[Dict[str, Any]]]:
        """
        Synthesizes text into audio and captures word/sub-sentence timestamps.
        Returns (output_audio_path, timestamps_list).
        """
        logger.info(f"Synthesizing voiceover with voice='{voice}', rate={rate}, pitch={pitch}")
        Path(output_audio_path).parent.mkdir(parents=True, exist_ok=True)

        if voice.startswith("elevenlabs") and self.elevenlabs_key:
            return await self._synthesize_elevenlabs(text, output_audio_path)

        # Default Edge-TTS
        return await self._synthesize_edge_tts(text, output_audio_path, voice, rate, pitch)

    async def _synthesize_edge_tts(
        self,
        text: str,
        output_audio_path: str,
        voice: str,
        rate: float,
        pitch: int
    ) -> Tuple[str, List[Dict[str, Any]]]:
        rate_str = f"{int((rate - 1.0) * 100):+d}%"
        pitch_str = f"{pitch:+d}Hz"

        communicate = edge_tts.Communicate(
            text=text,
            voice=voice,
            rate=rate_str,
            pitch=pitch_str
        )

        word_timings = []
        with open(output_audio_path, "wb") as f:
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    f.write(chunk["data"])
                elif chunk["type"] == "WordBoundary":
                    word_timings.append({
                        "text": chunk.get("text", ""),
                        "start": chunk.get("offset", 0) / 10_000_000.0, # convert 100ns to seconds
                        "duration": chunk.get("duration", 0) / 10_000_000.0,
                        "end": (chunk.get("offset", 0) + chunk.get("duration", 0)) / 10_000_000.0
                    })

        return output_audio_path, word_timings

    async def _synthesize_elevenlabs(
        self,
        text: str,
        output_audio_path: str,
        voice_id: str = "pNInz6obpgDQGcFmaJgB" # Adam
    ) -> Tuple[str, List[Dict[str, Any]]]:
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
        headers = {
            "xi-api-key": self.elevenlabs_key,
            "Content-Type": "application/json"
        }
        payload = {
            "text": text,
            "model_id": "eleven_monolingual_v1",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.75
            }
        }
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, json=payload, headers=headers)
            response.raise_for_status()
            with open(output_audio_path, "wb") as f:
                f.write(response.content)

        return output_audio_path, []

    def get_audio_duration(self, audio_path: str) -> float:
        """Extracts exact duration in seconds using ffprobe or fallback estimation."""
        ffmpeg_bin = settings.find_ffmpeg()
        ffprobe_bin = ffmpeg_bin.replace("ffmpeg.exe", "ffprobe.exe") if "ffmpeg.exe" in ffmpeg_bin else "ffprobe"

        try:
            cmd = [
                ffprobe_bin if os.path.exists(ffprobe_bin) else ffmpeg_bin,
                "-i", audio_path
            ]
            res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=10)
            # parse Duration: 00:00:15.34
            import re
            match = re.search(r"Duration:\s*(\d+):(\d+):(\d+\.\d+)", res.stderr)
            if match:
                hours, minutes, seconds = map(float, match.groups())
                return hours * 3600 + minutes * 60 + seconds
        except Exception as e:
            logger.warning(f"Failed to probe audio duration with ffprobe: {e}")

        # Fallback estimation: MP3 size or word count
        try:
            size = os.path.getsize(audio_path)
            # typical 128kbps = 16000 bytes/sec
            return max(size / 16000.0, 3.0)
        except Exception:
            return 15.0

tts_service = TTSService()
