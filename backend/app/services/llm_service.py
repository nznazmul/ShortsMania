import json
import re
from typing import Optional, Dict, Any, List
import httpx

from app.core.config import settings
from app.core.logger import logger
from app.models.schemas import ScriptData, SceneItem, ScriptToneType

class LLMService:
    """Handles script generation and refinement using Gemini, OpenAI, or smart local fallback."""

    def __init__(self):
        self.gemini_key = settings.GEMINI_API_KEY
        self.openai_key = settings.OPENAI_API_KEY

    def update_keys(self, gemini_key: Optional[str] = None, openai_key: Optional[str] = None):
        if gemini_key is not None:
            self.gemini_key = gemini_key
        if openai_key is not None:
            self.openai_key = openai_key

    async def generate_script(
        self,
        prompt: str,
        tone: ScriptToneType = "Viral",
        duration: int = 30,
        language: str = "English"
    ) -> ScriptData:
        """Generates a structured video script broken into scenes."""
        logger.info(f"Generating script for prompt: '{prompt}', tone: {tone}, duration: {duration}s, lang: {language}")

        # Calculate approximate number of scenes (each scene 3-6 seconds)
        target_scene_count = max(3, min(duration // 5, 10))

        # 1. Try Gemini if configured
        if self.gemini_key:
            try:
                script = await self._generate_with_gemini(prompt, tone, duration, language, target_scene_count)
                if script and script.scenes:
                    logger.info("Successfully generated script with Gemini")
                    return script
            except Exception as e:
                logger.warning(f"Gemini generation failed: {e}. Falling back...")

        # 2. Try OpenAI if configured
        if self.openai_key:
            try:
                script = await self._generate_with_openai(prompt, tone, duration, language, target_scene_count)
                if script and script.scenes:
                    logger.info("Successfully generated script with OpenAI")
                    return script
            except Exception as e:
                logger.warning(f"OpenAI generation failed: {e}. Falling back...")

        # 3. Use Smart Local Fallback Generator
        logger.info("Using Built-in Smart AI Script Engine")
        return self._generate_smart_fallback(prompt, tone, duration, language, target_scene_count)

    async def _generate_with_gemini(
        self,
        prompt: str,
        tone: str,
        duration: int,
        language: str,
        scene_count: int
    ) -> ScriptData:
        candidate_models = ["gemini-2.5-flash", "gemini-flash-latest", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-pro"]
        system_instruction = (
            f"You are a viral short-form video scriptwriter for TikTok, YouTube Shorts, and Instagram Reels. "
            f"Write a high-retention, fast-paced script in {language} with a {tone} tone. "
            f"Target duration is {duration} seconds. Break it into exactly {scene_count} punchy scenes. "
            f"Each scene must have spoken narration and 2-4 visual search keywords for stock footage. "
            f"Return ONLY valid JSON matching this exact structure: "
            f'{{"title": "Catchy Title", "tone": "{tone}", "language": "{language}", "tags": ["tag1", "tag2"], '
            f'"scenes": [{{"index": 1, "narration": "Hook line...", "visual_keywords": ["keyword1", "keyword2"], "duration": 4.5}}]}}'
        )

        payload = {
            "contents": [{
                "parts": [{"text": f"{system_instruction}\n\nTopic / Prompt: {prompt}"}]
            }],
            "generationConfig": {
                "response_mime_type": "application/json",
                "temperature": 0.7
            }
        }

        last_err = None
        async with httpx.AsyncClient(timeout=30.0) as client:
            for model_name in candidate_models:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={self.gemini_key}"
                try:
                    response = await client.post(url, json=payload)
                    if response.status_code == 200:
                        data = response.json()
                        raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
                        return self._parse_json_to_script(raw_text, tone, language, duration)
                    else:
                        last_err = f"{model_name} returned {response.status_code}: {response.text[:200]}"
                except Exception as e:
                    last_err = str(e)
                    continue

        raise RuntimeError(f"All Gemini model candidates failed: {last_err}")

    async def _generate_with_openai(
        self,
        prompt: str,
        tone: str,
        duration: int,
        language: str,
        scene_count: int
    ) -> ScriptData:
        url = "https://api.openai.com/v1/chat/completions"
        system_prompt = (
            f"You are an expert short-form video creator. Write an engaging video script in {language} with a {tone} tone. "
            f"Target length: {duration}s. Break into {scene_count} scenes. "
            f"Output strictly valid JSON with keys: title, tone, language, tags, scenes (each with index, narration, visual_keywords, duration)."
        )

        payload = {
            "model": "gpt-4o-mini",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Topic: {prompt}"}
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.7
        }

        headers = {
            "Authorization": f"Bearer {self.openai_key}",
            "Content-Type": "application/json"
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, json=payload, headers=headers)
            response.raise_for_status()
            data = response.json()
            raw_text = data["choices"][0]["message"]["content"]
            return self._parse_json_to_script(raw_text, tone, language, duration)

    def _parse_json_to_script(self, raw_json: str, tone: str, language: str, duration: int) -> ScriptData:
        # Strip markdown codeblocks if present
        clean_json = re.sub(r"^```json\s*", "", raw_json.strip())
        clean_json = re.sub(r"```$", "", clean_json.strip())
        data = json.loads(clean_json)

        scenes: List[SceneItem] = []
        for i, s in enumerate(data.get("scenes", [])):
            keywords = s.get("visual_keywords", [])
            if isinstance(keywords, str):
                keywords = [k.strip() for k in keywords.split(",")]
            scenes.append(SceneItem(
                index=i + 1,
                narration=s.get("narration", "").strip(),
                visual_keywords=keywords or ["abstract", "modern"],
                duration=float(s.get("duration", duration / max(len(data.get("scenes", [1])), 1)))
            ))

        return ScriptData(
            title=data.get("title", "Generated Short Video"),
            scenes=scenes,
            total_estimated_duration=float(duration),
            tags=data.get("tags", ["viral", "trending", "shorts"]),
            tone=tone, # type: ignore
            language=language
        )

    def _generate_smart_fallback(
        self,
        prompt: str,
        tone: ScriptToneType,
        duration: int,
        language: str,
        scene_count: int
    ) -> ScriptData:
        """Intelligent offline script engine with rich scene breakdowns based on topic and tone."""
        clean_topic = prompt.strip() or "Amazing Facts"
        topic_title = clean_topic.title()

        # Hooks based on tone
        hooks = {
            "Viral": [
                f"Did you know this crazy secret about {clean_topic}?",
                f"Stop scrolling! This single fact about {clean_topic} will blow your mind.",
                f"Here is why everyone is obsessed with {clean_topic} right now."
            ],
            "Educational": [
                f"Here is a complete breakdown of {clean_topic} in under 30 seconds.",
                f"What actually happens during {clean_topic}? Let's explore.",
                f"The science behind {clean_topic} is completely fascinating."
            ],
            "Storytelling": [
                f"It started out as an ordinary day, until {clean_topic} changed everything.",
                f"Imagine a world where {clean_topic} didn't exist.",
                f"This is the unbelievable true story behind {clean_topic}."
            ],
            "Humorous": [
                f"Nobody warned me that {clean_topic} could get this ridiculous.",
                f"If you think you understand {clean_topic}, think again.",
                f"Why does {clean_topic} feel like a glitch in the simulation?"
            ],
            "Motivational": [
                f"Mastering {clean_topic} is your key to unlocking unstoppable growth.",
                f"The biggest difference between success and failure is how you view {clean_topic}.",
                f"Every great achievement starts with understanding {clean_topic}."
            ],
            "Tech": [
                f"The future of {clean_topic} is arriving faster than you realize.",
                f"This revolutionary breakthrough in {clean_topic} changes the game forever.",
                f"Here is how modern technology is reshaping {clean_topic} today."
            ],
            "Finance": [
                f"How top investors use {clean_topic} to multiply their wealth.",
                f"The hidden financial truth about {clean_topic} that schools never taught you.",
                f"Why understanding {clean_topic} is crucial for your financial freedom."
            ]
        }

        # Body templates
        body_points = {
            "Viral": [
                (f"First, scientists discovered that {clean_topic} triggers an immediate psychological reaction.", ["shocked person", "brain scan", "viral"]),
                (f"Next, over eighty percent of people completely misunderstand how this works.", ["crowd", "thinking", "data"]),
                (f"When you look closer, the pattern is impossible to ignore.", ["microscope", "abstract network", "focus"]),
                (f"And the most surprising part? It happens every single day.", ["calendar", "sunrise", "time lapse"])
            ],
            "Educational": [
                (f"First, the fundamental principle behind {clean_topic} starts at the core foundation.", ["blueprint", "laboratory", "study"]),
                (f"Research shows that optimizing this process increases efficiency by over forty percent.", ["charts", "growth graph", "technology"]),
                (f"By applying this step-by-step method, the results become predictable and repeatable.", ["steps", "success", "analytics"]),
                (f"Understanding these key mechanisms gives you a clear advantage.", ["lightbulb idea", "clarity", "future"])
            ],
            "Storytelling": [
                (f"Deep in the origins of {clean_topic}, a hidden breakthrough was made.", ["ancient library", "history", "mystery"]),
                (f"Against all odds, the journey pushed past every known limitation.", ["mountain summit", "perseverance", "journey"]),
                (f"Today, the legacy continues to inspire millions around the globe.", ["crowd cheering", "global connection", "inspiration"])
            ],
            "Humorous": [
                (f"Exhibit A: the exact moment reality decides to take a break.", ["funny reaction", "confusion", "facepalm"]),
                (f"If common sense was currency, this would put us all in debt.", ["empty wallet", "laughing", "comedy"]),
                (f"Moral of the story: always expect the unexpected.", ["surprise", "smiling", "high five"])
            ],
            "Motivational": [
                (f"Pushing your limits on {clean_topic} requires relentless discipline and focus.", ["athlete training", "discipline", "running"]),
                (f"When you overcome the resistance, extraordinary breakthroughs become your new standard.", ["sunrise mountain", "victory", "champion"]),
                (f"Start today, stay consistent, and write your own success story.", ["writing journal", "focus", "fire"])
            ],
            "Tech": [
                (f"Processing over billions of calculations per second, the architecture is unmatched.", ["server room", "cyberpunk code", "ai neural"]),
                (f"Smart algorithms now optimize every single parameter in real time.", ["data stream", "quantum computing", "futuristic"]),
                (f"The next generation of innovation will redefine what is possible.", ["robotics", "hologram", "future city"])
            ],
            "Finance": [
                (f"Compound interest and asset allocation are the true engines of long-term wealth.", ["stock market ticker", "gold coins", "wealth"]),
                (f"By cutting out unnecessary downside, you preserve capital and maximize returns.", ["calculator", "financial plan", "growth"]),
                (f"Strategic patience always outperforms emotional market timing.", ["chess game", "steady hands", "success"])
            ]
        }

        # Outros
        outros = {
            "Viral": (f"Double tap if you learned something new, and subscribe for more mind-bending insights!", ["subscribe button", "smartphone like", "neon"]),
            "Educational": (f"Save this video for later and follow for your daily dose of knowledge!", ["bookmark", "knowledge", "glow"]),
            "Storytelling": (f"What part of this story shocked you the most? Drop your thoughts in the comments!", ["comment bubble", "speech", "discussion"]),
            "Humorous": (f"Tag a friend who needs to see this right now, and follow for more laughs!", ["laughter", "share", "friends"]),
            "Motivational": (f"Save this for motivation when you need it most. Keep pushing forward!", ["sunrise", "power", "triumph"]),
            "Tech": (f"Drop your tech predictions below and follow for cutting-edge updates!", ["digital globe", "future", "tech"]),
            "Finance": (f"Follow for more smart financial strategies to supercharge your wealth!", ["investment", "growth chart", "money"])
        }

        selected_hook = hooks.get(tone, hooks["Viral"])[0]
        selected_body = body_points.get(tone, body_points["Viral"])
        selected_outro = outros.get(tone, outros["Viral"])

        # Construct scenes
        scenes: List[SceneItem] = []
        scene_dur = round(duration / scene_count, 1)

        # Scene 1: Hook
        scenes.append(SceneItem(
            index=1,
            narration=selected_hook,
            visual_keywords=[clean_topic, "hook", "attention"],
            duration=scene_dur
        ))

        # Body scenes
        body_count = scene_count - 2
        for i in range(body_count):
            point_text, point_keys = selected_body[i % len(selected_body)]
            scenes.append(SceneItem(
                index=len(scenes) + 1,
                narration=point_text,
                visual_keywords=point_keys + [clean_topic],
                duration=scene_dur
            ))

        # Outro scene
        outro_text, outro_keys = selected_outro
        scenes.append(SceneItem(
            index=len(scenes) + 1,
            narration=outro_text,
            visual_keywords=outro_keys + ["shorts"],
            duration=scene_dur
        ))

        return ScriptData(
            title=f"The Truth About {topic_title}",
            scenes=scenes,
            total_estimated_duration=float(duration),
            tags=[clean_topic.lower(), tone.lower(), "shorts", "viral", "facts"],
            tone=tone,
            language=language
        )

llm_service = LLMService()
