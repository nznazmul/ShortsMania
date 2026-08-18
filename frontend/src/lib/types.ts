export type VideoAspectType = "9:16" | "16:9" | "1:1";
export type ScriptToneType = "Educational" | "Viral" | "Storytelling" | "Humorous" | "Motivational" | "Tech" | "Finance";
export type FootageSourceType = "pexels" | "pixabay" | "procedural" | "custom";
export type TaskStatusType = "pending" | "processing" | "completed" | "failed" | "cancelled";
export type TaskStageType =
  | "initializing"
  | "generating_script"
  | "synthesizing_audio"
  | "fetching_footage"
  | "syncing_captions"
  | "rendering_video"
  | "completed"
  | "failed";

export interface SubtitleStyle {
  font_name: string;
  font_size: number;
  primary_color: string;
  highlight_color: string;
  outline_color: string;
  outline_width: number;
  shadow_color: string;
  position: "bottom" | "center" | "top";
  animation: "karaoke_word" | "pop_in" | "clean_bottom" | "boxed";
}

export interface SceneItem {
  index: number;
  narration: string;
  visual_keywords: string[];
  duration: number;
  media_url?: string;
  media_path?: string;
}

export interface ScriptData {
  title: string;
  scenes: SceneItem[];
  total_estimated_duration: number;
  tags: string[];
  tone: ScriptToneType;
  language: string;
}

export interface GenerateVideoRequest {
  prompt: string;
  video_aspect: VideoAspectType;
  video_length: number;
  script_tone: ScriptToneType;
  language: string;
  voice_name: string;
  voice_rate: number;
  voice_pitch: number;
  bgm_type: string;
  bgm_volume: number;
  subtitle_style: SubtitleStyle;
  custom_script?: string | null;
  scenes?: SceneItem[] | null;
  footage_source: FootageSourceType;
}

export interface TaskLogEntry {
  timestamp: string;
  stage: TaskStageType;
  message: string;
  level: "info" | "warning" | "error" | "success";
}

export interface TaskProgress {
  task_id: string;
  status: TaskStatusType;
  stage: TaskStageType;
  progress: number;
  message: string;
  error?: string | null;
  video_url?: string | null;
  thumbnail_url?: string | null;
  video_duration?: number | null;
  video_aspect: VideoAspectType;
  title: string;
  script?: ScriptData | null;
  logs: TaskLogEntry[];
  created_at: string;
  updated_at: string;
}

export interface VoiceItem {
  id: string;
  name: string;
  language: string;
  gender: string;
  locale: string;
  provider: "edge-tts" | "elevenlabs" | "system";
  preview_url?: string | null;
}

export interface BgmItem {
  id: string;
  name: string;
  category: string;
  duration: number;
  file_path: string;
  preview_url: string;
}

export interface SettingsSchema {
  gemini_api_key_set: boolean;
  openai_api_key_set: boolean;
  pexels_api_key_set: boolean;
  pixabay_api_key_set: boolean;
  elevenlabs_api_key_set: boolean;
  default_aspect: VideoAspectType;
  default_voice: string;
  ffmpeg_detected: boolean;
  ffmpeg_path: string;
}
