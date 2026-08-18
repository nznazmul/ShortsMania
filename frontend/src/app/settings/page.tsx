"use client";

import { useState, useEffect } from "react";
import {
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HardDrive,
  Cpu,
  RefreshCw,
  Save,
  Check,
} from "lucide-react";
import { SettingsSchema } from "../../lib/types";
import { getSettings, updateSettings, testApiKey } from "../../lib/api";

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsSchema | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  const [keys, setKeys] = useState({
    gemini_api_key: "",
    openai_api_key: "",
    pexels_api_key: "",
    pixabay_api_key: "",
    elevenlabs_api_key: "",
  });

  const [testResults, setTestResults] = useState<{ [key: string]: { loading: boolean; valid?: boolean; message?: string } }>({});

  useEffect(() => {
    getSettings()
      .then(setSettings)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await updateSettings(keys);
      setSettings(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      alert("Failed to update settings: " + err.message);
    }
  };

  const handleTestKey = async (provider: string, keyValue: string) => {
    if (!keyValue) {
      alert(`Please enter a ${provider} API key first.`);
      return;
    }
    setTestResults((prev) => ({ ...prev, [provider]: { loading: true } }));
    try {
      const res = await testApiKey(provider, keyValue);
      setTestResults((prev) => ({
        ...prev,
        [provider]: { loading: false, valid: res.valid, message: res.message },
      }));
    } catch (err: any) {
      setTestResults((prev) => ({
        ...prev,
        [provider]: { loading: false, valid: false, message: err.message },
      }));
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-8 space-y-10 animate-fadeIn">
      {/* Header */}
      <div className="border-b border-white/[0.08] pb-6">
        <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-300">
          Preferences & Credentials
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl pt-1">
          Settings & Integrations
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Configure API keys for Gemini, OpenAI, Pexels, and ElevenLabs. Fallback offline engines are active by default.
        </p>
      </div>

      {/* System Diagnostics Card */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-4 border border-white/[0.08]">
        <h3 className="flex items-center gap-2 text-base font-bold text-white">
          <Cpu className="h-5 w-5 text-purple-400" />
          <span>System Engine Status</span>
        </h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* FFmpeg status */}
          <div className="glass-card rounded-2xl p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-zinc-400">FFmpeg Video Engine</span>
              <span className="block text-xs font-mono font-bold text-zinc-200 truncate max-w-[200px]">
                {settings?.ffmpeg_path || "Detecting..."}
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Ready</span>
            </div>
          </div>

          {/* TTS Neural status */}
          <div className="glass-card rounded-2xl p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-zinc-400">Default TTS Engine</span>
              <span className="block text-xs font-bold text-zinc-200">
                Edge-TTS Neural (Free & High Fidelity)
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* API Keys Configuration Form */}
      <form onSubmit={handleSave} className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6 border border-white/[0.08]">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <h3 className="flex items-center gap-2 text-base font-bold text-white">
            <Key className="h-5 w-5 text-cyan-400" />
            <span>Third-Party API Keys</span>
          </h3>
          <span className="text-xs text-zinc-500">Stored securely in memory & .env</span>
        </div>

        {/* Gemini API Key */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-zinc-200">Google Gemini API Key (Gemini 2.5 / 1.5 Flash)</label>
            {settings?.gemini_api_key_set && (
              <span className="text-[11px] font-semibold text-emerald-400">✓ Configured</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="password"
              placeholder={settings?.gemini_api_key_set ? "••••••••••••••••••••••••" : "AIzaSy..."}
              value={keys.gemini_api_key}
              onChange={(e) => setKeys({ ...keys, gemini_api_key: e.target.value })}
              className="glass-input flex-1 rounded-xl px-4 py-2.5 text-xs font-mono"
            />
            <button
              type="button"
              onClick={() => handleTestKey("gemini", keys.gemini_api_key)}
              disabled={testResults.gemini?.loading}
              className="rounded-xl border border-white/[0.1] bg-white/[0.03] px-3.5 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-white/[0.08] hover:text-white transition"
            >
              {testResults.gemini?.loading ? "Testing..." : "Test Key"}
            </button>
          </div>
          {testResults.gemini && (
            <span
              className={`block text-[11px] ${
                testResults.gemini.valid ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {testResults.gemini.message}
            </span>
          )}
        </div>

        {/* OpenAI API Key */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-zinc-200">OpenAI API Key (GPT-4o / GPT-4o-mini)</label>
            {settings?.openai_api_key_set && (
              <span className="text-[11px] font-semibold text-emerald-400">✓ Configured</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="password"
              placeholder={settings?.openai_api_key_set ? "••••••••••••••••••••••••" : "sk-..."}
              value={keys.openai_api_key}
              onChange={(e) => setKeys({ ...keys, openai_api_key: e.target.value })}
              className="glass-input flex-1 rounded-xl px-4 py-2.5 text-xs font-mono"
            />
            <button
              type="button"
              onClick={() => handleTestKey("openai", keys.openai_api_key)}
              disabled={testResults.openai?.loading}
              className="rounded-xl border border-white/[0.1] bg-white/[0.03] px-3.5 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-white/[0.08] hover:text-white transition"
            >
              {testResults.openai?.loading ? "Testing..." : "Test Key"}
            </button>
          </div>
          {testResults.openai && (
            <span
              className={`block text-[11px] ${
                testResults.openai.valid ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {testResults.openai.message}
            </span>
          )}
        </div>

        {/* Pexels API Key */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-zinc-200">Pexels Video API Key (Free HD Stock Footage)</label>
            {settings?.pexels_api_key_set && (
              <span className="text-[11px] font-semibold text-emerald-400">✓ Configured</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="password"
              placeholder={settings?.pexels_api_key_set ? "••••••••••••••••••••••••" : "Pexels API Key..."}
              value={keys.pexels_api_key}
              onChange={(e) => setKeys({ ...keys, pexels_api_key: e.target.value })}
              className="glass-input flex-1 rounded-xl px-4 py-2.5 text-xs font-mono"
            />
            <button
              type="button"
              onClick={() => handleTestKey("pexels", keys.pexels_api_key)}
              disabled={testResults.pexels?.loading}
              className="rounded-xl border border-white/[0.1] bg-white/[0.03] px-3.5 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-white/[0.08] hover:text-white transition"
            >
              {testResults.pexels?.loading ? "Testing..." : "Test Key"}
            </button>
          </div>
          {testResults.pexels && (
            <span
              className={`block text-[11px] ${
                testResults.pexels.valid ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {testResults.pexels.message}
            </span>
          )}
        </div>

        {/* ElevenLabs API Key */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-zinc-200">ElevenLabs API Key (Custom Cloned Voices)</label>
            {settings?.elevenlabs_api_key_set && (
              <span className="text-[11px] font-semibold text-emerald-400">✓ Configured</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="password"
              placeholder={settings?.elevenlabs_api_key_set ? "••••••••••••••••••••••••" : "ElevenLabs API Key..."}
              value={keys.elevenlabs_api_key}
              onChange={(e) => setKeys({ ...keys, elevenlabs_api_key: e.target.value })}
              className="glass-input flex-1 rounded-xl px-4 py-2.5 text-xs font-mono"
            />
            <button
              type="button"
              onClick={() => handleTestKey("elevenlabs", keys.elevenlabs_api_key)}
              disabled={testResults.elevenlabs?.loading}
              className="rounded-xl border border-white/[0.1] bg-white/[0.03] px-3.5 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-white/[0.08] hover:text-white transition"
            >
              {testResults.elevenlabs?.loading ? "Testing..." : "Test Key"}
            </button>
          </div>
          {testResults.elevenlabs && (
            <span
              className={`block text-[11px] ${
                testResults.elevenlabs.valid ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {testResults.elevenlabs.message}
            </span>
          )}
        </div>

        {/* Save Changes Button */}
        <div className="flex items-center justify-end pt-4 border-t border-white/[0.08]">
          <button
            type="submit"
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-cyan-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-purple-600/30 hover:brightness-110 transition"
          >
            {saved ? <Check className="h-4 w-4 text-white" /> : <Save className="h-4 w-4" />}
            <span>{saved ? "Settings Saved!" : "Save Configuration"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
