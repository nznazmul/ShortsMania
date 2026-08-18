"use client";

import { useState } from "react";
import { Sparkles, Smartphone, Monitor, Clock, MessageSquare, Globe, AlignLeft } from "lucide-react";
import { GenerateVideoRequest, VideoAspectType, ScriptToneType } from "../../lib/types";

interface Step1Props {
  formData: GenerateVideoRequest;
  updateForm: (updates: Partial<GenerateVideoRequest>) => void;
  onNext: () => void;
}

export function Step1Prompt({ formData, updateForm, onNext }: Step1Props) {
  const [useCustomScript, setUseCustomScript] = useState(Boolean(formData.custom_script));

  const promptIdeas = [
    { title: "🌌 Deep Space Mysteries", prompt: "3 Mind-Blowing Facts About Supermassive Black Holes" },
    { title: "🤖 AI Revolution", prompt: "How Quantum AI Will Change Everyday Life in 2030" },
    { title: "🧠 Brain & Psychology", prompt: "The Psychological Trick That Makes Anyone Trust You" },
    { title: "💰 Wealth & Investing", prompt: "The Secret Financial Rule That Built Modern Billionaires" },
    { title: "⏳ Dark History", prompt: "The Lost Ancient City That Mysteriously Vanished Overnight" },
    { title: "⚡ Stoic Motivation", prompt: "Why Discipline Will Always Destroy Motivation Every Time" },
  ];

  const tones: ScriptToneType[] = [
    "Viral",
    "Educational",
    "Storytelling",
    "Humorous",
    "Motivational",
    "Tech",
    "Finance",
  ];

  const languages = [
    { code: "English", label: "English (US/UK)" },
    { code: "Spanish", label: "Spanish (Español)" },
    { code: "French", label: "French (Français)" },
    { code: "German", label: "German (Deutsch)" },
    { code: "Hindi", label: "Hindi (हिंदी)" },
    { code: "Chinese", label: "Chinese (Mandarin)" },
    { code: "Japanese", label: "Japanese (日本語)" },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Info */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          1. Topic, Format & Script Strategy
        </h2>
        <p className="mt-1 text-sm text-zinc-400">
          Enter your video topic or paste a ready-made script. Choose the aspect ratio and duration.
        </p>
      </div>

      {/* Input Mode Toggle */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => {
            setUseCustomScript(false);
            updateForm({ custom_script: null });
          }}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
            !useCustomScript
              ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
              : "bg-white/[0.04] text-zinc-400 hover:text-white"
          }`}
        >
          <Sparkles className="h-4 w-4" />
          <span>AI Topic Generator</span>
        </button>

        <button
          type="button"
          onClick={() => setUseCustomScript(true)}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
            useCustomScript
              ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
              : "bg-white/[0.04] text-zinc-400 hover:text-white"
          }`}
        >
          <AlignLeft className="h-4 w-4" />
          <span>Paste Custom Script</span>
        </button>
      </div>

      {/* Main Input Textarea */}
      {!useCustomScript ? (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-zinc-300">
            Video Topic / Core Keyword
          </label>
          <div className="relative">
            <textarea
              rows={3}
              value={formData.prompt}
              onChange={(e) => updateForm({ prompt: e.target.value })}
              placeholder="e.g. 5 Shocking Secrets About The Mariana Trench, or Why Rome Fell..."
              className="glass-input w-full rounded-2xl p-4 text-base placeholder-zinc-500 focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Quick Idea Chips */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-zinc-400">⚡ Trending Inspiration Topics:</span>
            <div className="flex flex-wrap gap-2">
              {promptIdeas.map((idea, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => updateForm({ prompt: idea.prompt })}
                  className="rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-1 text-xs text-zinc-300 transition hover:border-purple-500/50 hover:bg-purple-500/10 hover:text-purple-300"
                >
                  {idea.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-zinc-300">
            Custom Narration Script (Line by Line)
          </label>
          <textarea
            rows={5}
            value={formData.custom_script || ""}
            onChange={(e) => updateForm({ custom_script: e.target.value, prompt: e.target.value.slice(0, 40) })}
            placeholder="Line 1: Did you know this crazy fact?&#10;Line 2: Scientists discovered that over eighty percent misunderstood it.&#10;Line 3: Subscribe for more daily insights!"
            className="glass-input w-full rounded-2xl p-4 text-sm font-mono placeholder-zinc-500"
          />
        </div>
      )}

      {/* Video Aspect Ratio & Duration */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Aspect Ratio */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-zinc-300">Target Video Format</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => updateForm({ video_aspect: "9:16" })}
              className={`flex flex-col items-center justify-center gap-2 rounded-2xl p-4 transition ${
                formData.video_aspect === "9:16"
                  ? "border-2 border-purple-500 bg-purple-500/15 text-white shadow-lg shadow-purple-500/20"
                  : "glass-card text-zinc-400 hover:text-white"
              }`}
            >
              <Smartphone className="h-6 w-6 text-purple-400" />
              <div className="text-center">
                <span className="block text-sm font-bold">9:16 Vertical</span>
                <span className="text-[11px] text-zinc-400">TikTok, Shorts, Reels</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => updateForm({ video_aspect: "16:9" })}
              className={`flex flex-col items-center justify-center gap-2 rounded-2xl p-4 transition ${
                formData.video_aspect === "16:9"
                  ? "border-2 border-purple-500 bg-purple-500/15 text-white shadow-lg shadow-purple-500/20"
                  : "glass-card text-zinc-400 hover:text-white"
              }`}
            >
              <Monitor className="h-6 w-6 text-cyan-400" />
              <div className="text-center">
                <span className="block text-sm font-bold">16:9 Horizontal</span>
                <span className="text-[11px] text-zinc-400">YouTube, Standard</span>
              </div>
            </button>
          </div>
        </div>

        {/* Target Duration */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-zinc-300">Target Duration</label>
          <div className="grid grid-cols-3 gap-2.5">
            {[15, 30, 60].map((dur) => (
              <button
                key={dur}
                type="button"
                onClick={() => updateForm({ video_length: dur })}
                className={`flex flex-col items-center justify-center gap-1 rounded-2xl p-3.5 transition ${
                  formData.video_length === dur
                    ? "border-2 border-purple-500 bg-purple-500/15 text-white shadow-lg shadow-purple-500/20"
                    : "glass-card text-zinc-400 hover:text-white"
                }`}
              >
                <Clock className="h-4 w-4 text-purple-400" />
                <span className="text-base font-bold">{dur}s</span>
                <span className="text-[10px] text-zinc-500">
                  {dur === 15 ? "Fast Hook" : dur === 30 ? "Standard" : "Deep Dive"}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tone & Language Selection */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="flex items-center gap-1.5 text-sm font-medium text-zinc-300">
            <MessageSquare className="h-4 w-4 text-purple-400" />
            <span>Tone of Voice</span>
          </label>
          <select
            value={formData.script_tone}
            onChange={(e) => updateForm({ script_tone: e.target.value as ScriptToneType })}
            className="glass-input w-full rounded-xl p-3 text-sm"
          >
            {tones.map((t) => (
              <option key={t} value={t} className="bg-zinc-900 text-white">
                {t} {t === "Viral" ? "🔥" : t === "Educational" ? "📚" : t === "Storytelling" ? "📖" : "💡"}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-1.5 text-sm font-medium text-zinc-300">
            <Globe className="h-4 w-4 text-cyan-400" />
            <span>Script Language</span>
          </label>
          <select
            value={formData.language}
            onChange={(e) => updateForm({ language: e.target.value })}
            className="glass-input w-full rounded-xl p-3 text-sm"
          >
            {languages.map((l) => (
              <option key={l.code} value={l.code} className="bg-zinc-900 text-white">
                {l.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Next Step Button */}
      <div className="flex justify-end pt-4">
        <button
          type="button"
          onClick={onNext}
          disabled={!formData.prompt && !formData.custom_script}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-purple-600/30 transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>Continue to Script Studio</span>
          <Sparkles className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
