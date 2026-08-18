import os
import re
from pathlib import Path
from typing import List, Dict, Any, Tuple
from app.core.logger import logger
from app.models.schemas import SubtitleStyle

class SubtitleService:
    """Generates styled ASS (Advanced SubStation Alpha) and SRT subtitles for FFmpeg rendering."""

    def hex_to_ass_color(self, hex_color: str, alpha: str = "00") -> str:
        """Converts '#RRGGBB' to ASS format '&HAABBGGRR'."""
        hex_clean = hex_color.lstrip("#").upper()
        if len(hex_clean) == 6:
            r = hex_clean[0:2]
            g = hex_clean[2:4]
            b = hex_clean[4:6]
            return f"&H{alpha}{b}{g}{r}"
        return f"&H{alpha}FFFFFF"

    def format_ass_time(self, seconds: float) -> str:
        """Formats seconds into ASS timestamp: H:MM:SS.cs"""
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        centisecs = int(round((seconds - int(seconds)) * 100))
        if centisecs >= 100:
            centisecs = 99
        return f"{hours}:{minutes:02d}:{secs:02d}.{centisecs:02d}"

    def generate_ass_subtitles(
        self,
        word_timings: List[Dict[str, Any]],
        full_text: str,
        total_duration: float,
        style: SubtitleStyle,
        output_ass_path: str,
        video_width: int = 1080,
        video_height: int = 1920
    ) -> str:
        """Generates a complete .ass subtitle file with typography, color, and animation rules."""
        logger.info(f"Generating ASS subtitles with style: font={style.font_name}, anim={style.animation}, color={style.primary_color}")
        Path(output_ass_path).parent.mkdir(parents=True, exist_ok=True)

        primary_bgr = self.hex_to_ass_color(style.primary_color)
        highlight_bgr = self.hex_to_ass_color(style.highlight_color)
        outline_bgr = self.hex_to_ass_color(style.outline_color)
        shadow_bgr = self.hex_to_ass_color(style.shadow_color)

        alignment = 2 # bottom center
        margin_v = int(video_height * 0.15) # 15% from bottom
        if style.position == "center":
            alignment = 5 # middle center
            margin_v = 0
        elif style.position == "top":
            alignment = 8 # top center
            margin_v = int(video_height * 0.12)

        font_size = style.font_size
        if video_width == 1080 and video_height == 1920:
            font_size = max(style.font_size, 48) # Scale for 1080x1920 vertical video
        elif video_width == 1920 and video_height == 1080:
            font_size = max(style.font_size, 40) # Scale for 1920x1080 horizontal video

        border_style = 3 if style.animation == "boxed" else 1

        ass_header = f"""[Script Info]
Title: ShortsMania Subtitles
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes
YCbCr Matrix: TV.601
PlayResX: {video_width}
PlayResY: {video_height}

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,{style.font_name},{font_size},{primary_bgr},{highlight_bgr},{outline_bgr},{shadow_bgr},-1,0,0,0,100,100,1,0,{border_style},{style.outline_width},2,{alignment},40,40,{margin_v},1
Style: Highlight,{style.font_name},{font_size},{highlight_bgr},{primary_bgr},{outline_bgr},{shadow_bgr},-1,0,0,0,100,100,1,0,{border_style},{style.outline_width + 1},3,{alignment},40,40,{margin_v},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""

        events = []

        # If we have granular word timings from Edge-TTS
        if word_timings and len(word_timings) > 0:
            # Group words into short dynamic phrases (3 to 6 words per subtitle line)
            phrases = self._group_words_into_phrases(word_timings, max_words=4)
            for phrase in phrases:
                start_str = self.format_ass_time(phrase["start"])
                end_str = self.format_ass_time(phrase["end"])

                if style.animation == "karaoke_word":
                    # Build karaoke formatted line with \k tags (centiseconds)
                    karaoke_text = ""
                    for w in phrase["words"]:
                        duration_cs = max(int(round(w["duration"] * 100)), 5)
                        karaoke_text += f"{{\\k{duration_cs}}}{w['text']} "
                    events.append(f"Dialogue: 0,{start_str},{end_str},Default,,0,0,0,,{karaoke_text.strip()}")

                elif style.animation == "pop_in":
                    # Pop animation: scales from 115% down to 100% on start
                    raw_text = " ".join([w["text"] for w in phrase["words"]])
                    pop_tag = "{\\t(0,100,\\fscx115\\fscy115)\\t(100,200,\\fscx100\\fscy100)}"
                    events.append(f"Dialogue: 0,{start_str},{end_str},Default,,0,0,0,,{pop_tag}{raw_text}")

                else:
                    raw_text = " ".join([w["text"] for w in phrase["words"]])
                    events.append(f"Dialogue: 0,{start_str},{end_str},Default,,0,0,0,,{raw_text}")

        else:
            # Fallback: Split full text into sentence chunks distributed across total duration
            sentences = re.split(r"(?<=[.!?])\s+", full_text.strip())
            sentences = [s.strip() for s in sentences if s.strip()]
            if not sentences:
                sentences = [full_text.strip() or "ShortsMania AI Video"]

            chunk_duration = total_duration / len(sentences)
            for i, sent in enumerate(sentences):
                start_t = i * chunk_duration
                end_t = (i + 1) * chunk_duration
                start_str = self.format_ass_time(start_t)
                end_str = self.format_ass_time(end_t)
                events.append(f"Dialogue: 0,{start_str},{end_str},Default,,0,0,0,,{sent}")

        content = ass_header + "\n".join(events) + "\n"
        with open(output_ass_path, "w", encoding="utf-8") as f:
            f.write(content)

        return output_ass_path

    def _group_words_into_phrases(self, word_timings: List[Dict[str, Any]], max_words: int = 4) -> List[Dict[str, Any]]:
        phrases = []
        current_words = []

        for w in word_timings:
            current_words.append(w)
            if len(current_words) >= max_words or w["text"].endswith((".", "!", "?", ",")):
                start = current_words[0]["start"]
                end = current_words[-1]["end"]
                phrases.append({
                    "start": start,
                    "end": end,
                    "words": list(current_words)
                })
                current_words = []

        if current_words:
            start = current_words[0]["start"]
            end = current_words[-1]["end"]
            phrases.append({
                "start": start,
                "end": end,
                "words": list(current_words)
            })

        return phrases

subtitle_service = SubtitleService()
