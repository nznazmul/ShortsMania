import {
  GenerateVideoRequest,
  TaskProgress,
  ScriptData,
  VoiceItem,
  BgmItem,
  SettingsSchema,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export async function createTask(payload: GenerateVideoRequest): Promise<TaskProgress> {
  const res = await fetch(`${API_BASE}/tasks/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Failed to create task" }));
    throw new Error(err.detail || "Failed to create task");
  }
  return res.json();
}

export async function getTask(taskId: string): Promise<TaskProgress> {
  const res = await fetch(`${API_BASE}/tasks/${taskId}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Task not found");
  return res.json();
}

export async function listTasks(): Promise<TaskProgress[]> {
  const res = await fetch(`${API_BASE}/tasks`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch tasks");
  return res.json();
}

export async function deleteTask(taskId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/tasks/${taskId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete task");
}

export async function generateScript(params: {
  prompt: string;
  tone: string;
  duration: number;
  language: string;
}): Promise<ScriptData> {
  const res = await fetch(`${API_BASE}/llm/generate-script`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Failed to generate script" }));
    throw new Error(err.detail || "Failed to generate script");
  }
  return res.json();
}

export async function getVoices(): Promise<VoiceItem[]> {
  const res = await fetch(`${API_BASE}/media/voices`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch voices");
  return res.json();
}

export async function previewVoice(
  voiceName: string,
  text: string,
  rate: number = 1.0,
  pitch: number = 0
): Promise<string> {
  const res = await fetch(`${API_BASE}/media/tts/preview`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ voice_name: voiceName, text, rate, pitch }),
  });
  if (!res.ok) throw new Error("Failed to preview voice");
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

export async function getBgmList(): Promise<BgmItem[]> {
  const res = await fetch(`${API_BASE}/media/bgm`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch BGM list");
  return res.json();
}

export async function getSettings(): Promise<SettingsSchema> {
  const res = await fetch(`${API_BASE}/settings`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch settings");
  return res.json();
}

export async function updateSettings(payload: Record<string, string>): Promise<SettingsSchema> {
  const res = await fetch(`${API_BASE}/settings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update settings");
  return res.json();
}

export async function testApiKey(provider: string, apiKey: string): Promise<{ valid: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/settings/test-key?provider=${provider}&api_key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
  });
  return res.json();
}
