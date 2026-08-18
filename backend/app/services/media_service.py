import os
import random
import subprocess
from pathlib import Path
from typing import List, Optional, Dict, Any
import httpx

from app.core.config import settings
from app.core.logger import logger
from app.models.schemas import VideoAspectType

class MediaService:
    """Handles stock video sourcing (Pexels, Pixabay) and procedural background generation."""

    def __init__(self):
        self.pexels_key = settings.PEXELS_API_KEY
        self.pixabay_key = settings.PIXABAY_API_KEY

    def update_keys(self, pexels_key: Optional[str] = None, pixabay_key: Optional[str] = None):
        if pexels_key is not None:
            self.pexels_key = pexels_key
        if pixabay_key is not None:
            self.pixabay_key = pixabay_key

    def _is_valid_video_file(self, file_path: str) -> bool:
        """Verifies that a video file exists, is non-empty, and can be read by FFmpeg."""
        if not os.path.exists(file_path) or os.path.getsize(file_path) < 20000:
            return False
        ffmpeg_bin = settings.find_ffmpeg()
        cmd = [ffmpeg_bin, "-v", "error", "-i", file_path, "-t", "1", "-f", "null", "-"]
        try:
            res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=5)
            if res.returncode == 0:
                return True
            logger.warning(f"Video file {file_path} failed FFmpeg validation: {res.stderr}")
            return False
        except Exception as e:
            logger.warning(f"Validation exception for {file_path}: {e}")
            return False

    async def fetch_scene_footage(
        self,
        keywords: List[str],
        duration: float,
        aspect: VideoAspectType,
        output_path: str,
        scene_index: int = 1
    ) -> str:
        """
        Finds or generates high-definition footage for a single scene.
        Guaranteed to output a valid mp4 file.
        """
        logger.info(f"Sourcing footage for scene {scene_index} (keywords={keywords}, duration={duration}s, aspect={aspect})")
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)

        orientation = "portrait" if aspect == "9:16" else "landscape"
        search_query = " ".join(keywords[:2]) if keywords else "cinematic dark abstract"

        # 1. Try Pexels API if key provided
        if self.pexels_key:
            try:
                downloaded = await self._search_and_download_pexels(search_query, orientation, output_path, duration)
                if downloaded and self._is_valid_video_file(output_path):
                    logger.info(f"Successfully downloaded Pexels footage for scene {scene_index}")
                    return output_path
                else:
                    if os.path.exists(output_path):
                        os.remove(output_path)
            except Exception as e:
                logger.warning(f"Pexels footage search failed: {e}. Falling back...")
                if os.path.exists(output_path):
                    os.remove(output_path)

        # 2. Try Pixabay API if key provided
        if self.pixabay_key:
            try:
                downloaded = await self._search_and_download_pixabay(search_query, orientation, output_path, duration)
                if downloaded and self._is_valid_video_file(output_path):
                    logger.info(f"Successfully downloaded Pixabay footage for scene {scene_index}")
                    return output_path
                else:
                    if os.path.exists(output_path):
                        os.remove(output_path)
            except Exception as e:
                logger.warning(f"Pixabay footage search failed: {e}. Falling back...")
                if os.path.exists(output_path):
                    os.remove(output_path)

        # 3. Procedural Motion Background Generator (Offline Fallback Engine)
        logger.info(f"Generating procedural motion visual for scene {scene_index}")
        return self._generate_procedural_background(duration, aspect, output_path, scene_index)

    async def _search_and_download_pexels(self, query: str, orientation: str, output_path: str, min_duration: float) -> bool:
        url = "https://api.pexels.com/videos/search"
        headers = {"Authorization": self.pexels_key}
        params = {
            "query": query,
            "orientation": orientation,
            "per_page": 10,
            "size": "medium"
        }

        async with httpx.AsyncClient(timeout=20.0) as client:
            res = await client.get(url, headers=headers, params=params)
            res.raise_for_status()
            data = res.json()
            videos = data.get("videos", [])
            if not videos:
                return False

            video = random.choice(videos[:5])
            video_files = video.get("video_files", [])
            # Find best resolution file
            target_file = None
            for vf in sorted(video_files, key=lambda x: x.get("width", 0) * x.get("height", 0), reverse=True):
                if orientation == "portrait" and vf.get("height", 0) > vf.get("width", 0):
                    target_file = vf
                    break
                elif orientation == "landscape" and vf.get("width", 0) > vf.get("height", 0):
                    target_file = vf
                    break
            if not target_file and video_files:
                target_file = video_files[0]

            download_url = target_file.get("link")
            if not download_url:
                return False

            # Download video
            v_res = await client.get(download_url, follow_redirects=True, timeout=60.0)
            v_res.raise_for_status()
            with open(output_path, "wb") as f:
                f.write(v_res.content)
            return True

    async def _search_and_download_pixabay(self, query: str, orientation: str, output_path: str, min_duration: float) -> bool:
        url = "https://pixabay.com/api/videos/"
        params = {
            "key": self.pixabay_key,
            "q": query,
            "video_type": "film",
            "per_page": 10
        }
        async with httpx.AsyncClient(timeout=20.0) as client:
            res = await client.get(url, params=params)
            res.raise_for_status()
            hits = res.json().get("hits", [])
            if not hits:
                return False

            hit = random.choice(hits[:5])
            videos_obj = hit.get("videos", {})
            target = videos_obj.get("large", {}) or videos_obj.get("medium", {})
            download_url = target.get("url")
            if not download_url:
                return False

            v_res = await client.get(download_url, follow_redirects=True, timeout=60.0)
            v_res.raise_for_status()
            with open(output_path, "wb") as f:
                f.write(v_res.content)
            return True

    def _generate_procedural_background(
        self,
        duration: float,
        aspect: VideoAspectType,
        output_path: str,
        seed: int = 1
    ) -> str:
        """
        Uses FFmpeg filters to render an aesthetically rich dynamic gradient background.
        Universal across all FFmpeg versions.
        """
        ffmpeg_bin = settings.find_ffmpeg()
        width, height = (1080, 1920) if aspect == "9:16" else (1920, 1080)

        # Diverse aesthetic gradient color presets
        presets = [
            ("0x120e24", "0x3b1c68", "0x0ea5e9"), # Purple/Violet/Cyan Cyberpunk
            ("0x050816", "0x1e3a8a", "0x38bdf8"), # Deep Blue / Azure Tech
            ("0x061814", "0x065f46", "0x34d399"), # Emerald Matrix / Bio-tech
            ("0x1c0c0c", "0x991b1b", "0xfb923c"), # Fiery Crimson / Sunset
            ("0x141006", "0x854d0e", "0xfde047"), # Golden Luxury / Wealth
            ("0x0b0d1b", "0x3730a3", "0xc084fc"), # Deep Nebula / Space
        ]
        c_bg, c_mid, c_accent = presets[seed % len(presets)]

        # Procedural animated background (Optimized for Free Tier - removed heavy boxblur)
        filter_expr = (
            f"color=c={c_bg}:s={width}x{height}:d={duration}:r=30[bg];"
            f"color=c={c_mid}:s={width//2}x{height//2}:d={duration}:r=30[b1];"
            f"[bg][b1]overlay=x='(W-w)/2 + sin(t*1.5)*200':y='(H-h)/2 + cos(t*1.2)*250'[vout]"
        )

        cmd = [
            ffmpeg_bin, "-y",
            "-f", "lavfi", "-i", f"nullsrc=s={width}x{height}:d={duration}:r=30",
            "-filter_complex", filter_expr,
            "-map", "[vout]",
            "-t", str(duration),
            "-c:v", "libx264",
            "-preset", "ultrafast",
            "-pix_fmt", "yuv420p",
            "-an",
            output_path
        ]

        try:
            res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=30)
            if res.returncode != 0:
                logger.warning(f"Procedural generation filter failed ({res.stderr}), using solid aesthetic background...")
                simple_cmd = [
                    ffmpeg_bin, "-y",
                    "-f", "lavfi",
                    "-i", f"color=c={c_bg}:s={width}x{height}:d={duration}:r=30",
                    "-t", str(duration),
                    "-c:v", "libx264",
                    "-preset", "ultrafast",
                    "-pix_fmt", "yuv420p",
                    "-an",
                    output_path
                ]
                subprocess.run(simple_cmd, check=True, timeout=15)
        except Exception as e:
            logger.error(f"Failed to generate procedural video: {e}")
            raise RuntimeError(f"Procedural video generator failed to create footage for scene {seed}. Please add a Pexels or Pixabay API key.")

        if not os.path.exists(output_path) or os.path.getsize(output_path) < 1000:
            raise RuntimeError(f"Procedural video generator output was empty or invalid for scene {seed}. The server might be out of memory.")
            
        return output_path

media_service = MediaService()
