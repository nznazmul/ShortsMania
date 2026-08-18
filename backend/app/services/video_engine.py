import os
import subprocess
from pathlib import Path
from typing import List, Optional, Tuple
import math

from app.core.config import settings
from app.core.logger import logger
from app.models.schemas import VideoAspectType, SubtitleStyle
from app.services.subtitle_service import subtitle_service

class VideoEngine:
    """Core FFmpeg rendering pipeline for clip stitching, audio mixing, and subtitle burning."""

    def __init__(self):
        self.ffmpeg_bin = settings.find_ffmpeg()

    def normalize_scene_clip(
        self,
        input_video_path: str,
        output_clip_path: str,
        duration: float,
        aspect: VideoAspectType
    ) -> str:
        """
        Scales, center-crops, and standardizes a video clip to target resolution and duration.
        """
        # Reduced to 720p to prevent RAM crashes on Render Free Tier
        width, height = (720, 1280) if aspect == "9:16" else (1280, 720)
        Path(output_clip_path).parent.mkdir(parents=True, exist_ok=True)

        vf_filter = (
            f"scale={width}:{height}:force_original_aspect_ratio=increase,"
            f"crop={width}:{height},"
            f"setsar=1,"
            f"fps=30"
        )

        cmd = [
            self.ffmpeg_bin, "-y",
            "-i", input_video_path,
            "-t", str(duration),
            "-vf", vf_filter,
            "-c:v", "libx264",
            "-preset", "ultrafast",
            "-pix_fmt", "yuv420p",
            "-an",
            output_clip_path
        ]

        logger.info(f"Normalizing scene clip: {' '.join(cmd)}")
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=300)
        if res.returncode != 0:
            logger.error(f"FFmpeg error normalizing scene clip: {res.stderr}")
            raise RuntimeError(f"FFmpeg normalization failed: {res.stderr}")

        return output_clip_path

    def concatenate_clips(self, clip_paths: List[str], output_concat_path: str) -> str:
        """Concatenates normalized video clips using the FFmpeg concat demuxer."""
        Path(output_concat_path).parent.mkdir(parents=True, exist_ok=True)
        concat_list_file = Path(output_concat_path).parent / "concat_list.txt"

        with open(concat_list_file, "w", encoding="utf-8") as f:
            for p in clip_paths:
                escaped_path = os.path.abspath(p).replace("\\", "/")
                f.write(f"file '{escaped_path}'\n")

        cmd = [
            self.ffmpeg_bin, "-y",
            "-f", "concat",
            "-safe", "0",
            "-i", str(concat_list_file),
            "-c", "copy",
            output_concat_path
        ]

        logger.info(f"Concatenating {len(clip_paths)} clips...")
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=120)
        if res.returncode != 0:
            logger.error(f"FFmpeg error concatenating clips: {res.stderr}")
            raise RuntimeError(f"FFmpeg concat failed: {res.stderr}")

        return output_concat_path

    def generate_ambient_bgm(self, output_bgm_path: str, duration: float = 60.0) -> str:
        """Generates an aesthetic ambient background audio track procedurally using FFmpeg synth."""
        Path(output_bgm_path).parent.mkdir(parents=True, exist_ok=True)
        if os.path.exists(output_bgm_path) and os.path.getsize(output_bgm_path) > 1000:
            return output_bgm_path

        synth_expr = (
            "sine=frequency=220:duration=60[s1];"
            "sine=frequency=277.18:duration=60[s2];"
            "sine=frequency=329.63:duration=60[s3];"
            "sine=frequency=440:duration=60[s4];"
            "[s1][s2][s3][s4]amix=inputs=4:dropout_transition=0,volume=0.3,lowpass=f=800,aecho=0.8:0.88:60:0.4[aout]"
        )

        cmd = [
            self.ffmpeg_bin, "-y",
            "-f", "lavfi",
            "-i", "anullsrc=r=44100:cl=stereo",
            "-filter_complex", synth_expr,
            "-map", "[aout]",
            "-t", str(duration),
            "-c:a", "libmp3lame",
            "-b:a", "128k",
            output_bgm_path
        ]

        try:
            subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True, timeout=60)
        except Exception as e:
            logger.warning(f"Procedural BGM generation fallback failed: {e}")

        return output_bgm_path

    def render_final_video(
        self,
        concatenated_video_path: str,
        narration_audio_path: str,
        ass_subtitle_path: Optional[str],
        output_final_path: str,
        bgm_path: Optional[str] = None,
        bgm_volume: float = 0.18,
        total_duration: Optional[float] = None
    ) -> str:
        """
        Combines video, narration audio, background music (with ducking), and burns subtitles.
        """
        Path(output_final_path).parent.mkdir(parents=True, exist_ok=True)
        logger.info(f"Rendering final MP4 to {output_final_path}")

        effective_bgm = bgm_path
        if not effective_bgm or not os.path.exists(effective_bgm):
            default_bgm = settings.BGM_DIR / "ambient_synth.mp3"
            self.generate_ambient_bgm(str(default_bgm), duration=120.0)
            if default_bgm.exists():
                effective_bgm = str(default_bgm)

        sub_filter = ""
        if ass_subtitle_path and os.path.exists(ass_subtitle_path):
            ass_clean = os.path.abspath(ass_subtitle_path).replace("\\", "/").replace(":", "\\:")
            sub_filter = f",subtitles='{ass_clean}'"

        inputs = ["-i", concatenated_video_path, "-i", narration_audio_path]

        if effective_bgm and os.path.exists(effective_bgm) and bgm_volume > 0:
            inputs.extend(["-stream_loop", "-1", "-i", effective_bgm])
            filter_complex = (
                f"[0:v]{sub_filter.lstrip(',')}[vout];"
                f"[2:a]volume={bgm_volume}[bgm];"
                f"[1:a][bgm]amix=inputs=2:duration=first:dropout_transition=2[aout]"
            )
            map_args = ["-map", "[vout]", "-map", "[aout]"]
        else:
            filter_complex = f"[0:v]{sub_filter.lstrip(',')}[vout]"
            map_args = ["-map", "[vout]", "-map", "1:a"]

        cmd = [
            self.ffmpeg_bin, "-y",
            *inputs,
            "-filter_complex", filter_complex,
            *map_args,
            "-c:v", "libx264",
            "-preset", "veryfast",
            "-crf", "20",
            "-pix_fmt", "yuv420p",
            "-c:a", "aac",
            "-strict", "-2",
            "-b:a", "192k",
            "-shortest",
            "-movflags", "+faststart",
            output_final_path
        ]

        logger.info(f"Executing final render pipeline: {' '.join(cmd)}")
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=600)
        if res.returncode != 0:
            logger.warning(f"Primary render with subtitles failed: {res.stderr}. Retrying without subtitle burn...")
            simple_filter = (
                f"[2:a]volume={bgm_volume}[bgm];[1:a][bgm]amix=inputs=2:duration=first[aout]"
                if effective_bgm and os.path.exists(effective_bgm) and bgm_volume > 0
                else "[1:a]volume=1.0[aout]"
            )
            fallback_cmd = [
                self.ffmpeg_bin, "-y",
                *inputs,
                "-filter_complex", simple_filter,
                "-map", "0:v", "-map", "[aout]",
                "-c:v", "libx264",
                "-preset", "ultrafast",
                "-c:a", "aac",
                "-strict", "-2",
                "-shortest",
                output_final_path
            ]
            subprocess.run(fallback_cmd, check=True, timeout=300)

        return output_final_path

    def extract_thumbnail(self, video_path: str, thumbnail_path: str) -> str:
        """Extracts a poster frame at 1.0 second."""
        Path(thumbnail_path).parent.mkdir(parents=True, exist_ok=True)
        cmd = [
            self.ffmpeg_bin, "-y",
            "-ss", "00:00:01",
            "-i", video_path,
            "-vframes", "1",
            "-q:v", "2",
            thumbnail_path
        ]
        try:
            subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=10)
        except Exception as e:
            logger.warning(f"Thumbnail extraction failed: {e}")
        return thumbnail_path

video_engine = VideoEngine()
