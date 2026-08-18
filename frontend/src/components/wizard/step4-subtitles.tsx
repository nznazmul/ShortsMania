"use client";

import { useState } from "react";
import { Type, Palette, Sparkles, Layers, ArrowLeft, Video, Film, Eye } from "lucide-react";
import { GenerateVideoRequest, SubtitleStyle, FootageSourceType } from "../../lib/types";

interface Step4Props {
  formData: GenerateVideoRequest;
  updateForm: (updates: Partial<GenerateVideoRequest>) => void;
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting?: boolean;
}

export function Step4Subtitles({ formData, updateForm, onSubmit, onBack, isSubmitting = false }: Step4Props) {
  const [activeWordIndex, setActiveWordIndex] = useState(1);

  const style = formData.subtitle_style;

  const updateStyle = (updates: Partial<SubtitleStyle>) => {
    updateForm({
      subtitle_style: {
        ...formData.subtitle_style,
        ...updates,
      },
    });
  };

  const fonts = ["Arial", "Montserrat", "Impact", "Inter", "Roboto", "Trebuchet MS"];

  const animations = [
    {
      id: "karaoke_word",
      title: "Karaoke Word Highlight",
      desc: "Words illuminate in glowing accent as they are spoken",
      tag: "🔥 Viral TikTok",
    },
    {
      id: "pop_in",
      title: "Pop & Bounce Zoom",
      desc: "Each phrase pops in with smooth scale bounce",
      tag: "⚡ High Energy",
    },
    {
      id: "clean_bottom",
      title: "Clean Minimal Bold",
      desc: "Ultra-legible heavy stroke subtitles at lower third",
      tag: "🎬 Documentary",
    },
    {
      id: "boxed",
      title: "Solid Box Badge",
      desc: "Encased in a sleek dark contrast badge box",
      tag: "📱 YouTube Shorts",
    },
  ];

  const colorPresets = [
    { primary: "#FFFFFF", highlight: "#FFD700", outline: "#000000", label: "Classic Gold" },
    { primary: "#FFFFFF", highlight: "#06B6D4", outline: "#000000", label: "Electric Cyan" },
    { primary: "#FFFFFF", highlight: "#F43F5E", outline: "#000000", label: "Neon Pink" },
    { primary: "#FFFFFF", highlight: "#10B981", outline: "#000000", label: "Emerald Glow" },
  ];

  const sampleWords = ["Did", "you", "know", "this", "mind-blowing", "fact?"];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          4. Visual & Subtitle Customizer
        </h2>
        <p className="mt-1 text-sm text-zinc-400">
          Tailor subtitle typography, karaoke animation effects, and footage sourcing.
        </p>
      </div>

      {/* Live Interactive Preview Screen */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
          <Eye className="h-4 w-4 text-purple-400" />
          <span>Real-Time Subtitle & Video Canvas Preview</span>
        </label>

        <div className="relative mx-auto flex h-64 w-full max-w-md items-center justify-center overflow-hidden rounded-2xl border border-white/[0.1] bg-gradient-to-br from-purple-950/40 via-zinc-900 to-cyan-950/40 shadow-2xl">
          {/* Subtle animated background grid simulation */}
          <div className="absolute inset-0 bg-[radial-gradient(#8b5cf6_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />

          {/* Subtitle Box simulation */}
          <div
            className={`absolute px-6 text-center transition-all ${
              style.position === "top"
                ? "top-8"
                : style.position === "center"
                ? "top-1/2 -translate-y-1/2"
                : "bottom-8"
            }`}
          >
            <div
              className={`inline-block rounded-xl px-4 py-2 text-center transition-all ${
                style.animation === "boxed" ? "bg-black/80 border border-white/20 shadow-lg" : ""
              }`}
              style={{
                fontFamily: style.font_name,
                fontSize: `${style.font_size * 0.75}px`,
                fontWeight: "900",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                textShadow: `0px 2px 8px ${style.shadow_color}, -1px -1px 0 ${style.outline_color}, 1px -1px 0 ${style.outline_color}, -1px 1px 0 ${style.outline_color}, 1px 1px 0 ${style.outline_color}`,
              }}
            >
              {sampleWords.map((word, idx) => {
                const isHighlighted = idx === activeWordIndex;
                return (
                  <span
                    key={idx}
                    onClick={() => setActiveWordIndex(idx)}
                    className="cursor-pointer transition-colors duration-150 mr-1.5"
                    style={{
                      color: isHighlighted ? style.highlight_color : style.primary_color,
                      transform: isHighlighted && style.animation === "pop_in" ? "scale(1.15)" : "scale(1)",
                      display: "inline-block",
                    }}
                  >
                    {word}
                  </span>
                );
              })}
            </div>
            <span className="block text-[10px] text-zinc-400 mt-2">
              (Click words to test karaoke highlight)
            </span>
          </div>
        </div>
      </div>

      {/* Animation Style Selector */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-zinc-200">Subtitle Animation Preset</label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {animations.map((anim) => {
            const isSelected = style.animation === anim.id;
            return (
              <div
                key={anim.id}
                onClick={() => updateStyle({ animation: anim.id as any })}
                className={`cursor-pointer rounded-2xl p-4 transition ${
                  isSelected
                    ? "border-2 border-purple-500 bg-purple-500/15 text-white shadow-lg shadow-purple-500/20"
                    : "glass-card hover:border-white/[0.15]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-zinc-200">{anim.title}</span>
                  <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-[10px] font-semibold text-purple-300 border border-purple-500/30">
                    {anim.tag}
                  </span>
                </div>
                <p className="mt-1 text-xs text-zinc-400">{anim.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Typography & Position Controls */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
        {/* Font Family */}
        <div className="space-y-2">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
            <Type className="h-4 w-4 text-purple-400" />
            <span>Font Family</span>
          </label>
          <select
            value={style.font_name}
            onChange={(e) => updateStyle({ font_name: e.target.value })}
            className="glass-input w-full rounded-xl p-2.5 text-xs"
          >
            {fonts.map((f) => (
              <option key={f} value={f} className="bg-zinc-900 text-white">
                {f}
              </option>
            ))}
          </select>
        </div>

        {/* Position */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-zinc-300">Vertical Position</label>
          <div className="grid grid-cols-3 gap-1.5">
            {(["top", "center", "bottom"] as const).map((pos) => (
              <button
                key={pos}
                type="button"
                onClick={() => updateStyle({ position: pos })}
                className={`rounded-lg py-2 text-xs font-bold capitalize transition ${
                  style.position === pos
                    ? "bg-purple-600 text-white"
                    : "glass-card text-zinc-400 hover:text-white"
                }`}
              >
                {pos}
              </button>
            ))}
          </div>
        </div>

        {/* Font Size */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-300">
            <span>Font Size Scale</span>
            <span className="text-purple-400 font-mono">{style.font_size}pt</span>
          </div>
          <input
            type="range"
            min="20"
            max="40"
            step="2"
            value={style.font_size}
            onChange={(e) => updateStyle({ font_size: parseInt(e.target.value) })}
            className="w-full accent-purple-500 cursor-pointer"
          />
        </div>
      </div>

      {/* Color Themes */}
      <div className="space-y-3">
        <label className="flex items-center gap-1.5 text-sm font-semibold text-zinc-200">
          <Palette className="h-4 w-4 text-cyan-400" />
          <span>Color Themes & Highlights</span>
        </label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {colorPresets.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() =>
                updateStyle({
                  primary_color: preset.primary,
                  highlight_color: preset.highlight,
                  outline_color: preset.outline,
                })
              }
              className="glass-card flex items-center justify-between rounded-xl p-3 text-left transition hover:border-white/[0.2]"
            >
              <span className="text-xs font-semibold text-zinc-200">{preset.label}</span>
              <div className="flex items-center gap-1">
                <span className="h-4 w-4 rounded-full border border-black" style={{ backgroundColor: preset.primary }} />
                <span className="h-4 w-4 rounded-full border border-black" style={{ backgroundColor: preset.highlight }} />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Footage Provider Selection */}
      <div className="space-y-3">
        <label className="flex items-center gap-1.5 text-sm font-semibold text-zinc-200">
          <Film className="h-4 w-4 text-purple-400" />
          <span>Stock Footage Source Provider</span>
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { id: "pexels", name: "Pexels Video API", desc: "Curated HD stock clips matching scene keywords" },
            { id: "pixabay", name: "Pixabay Video API", desc: "Creative cinematic footage library" },
            { id: "procedural", name: "Procedural Canvas Synth", desc: "Dynamic motion gradients (100% Offline)" },
          ].map((src) => {
            const isSelected = formData.footage_source === src.id;
            return (
              <div
                key={src.id}
                onClick={() => updateForm({ footage_source: src.id as FootageSourceType })}
                className={`cursor-pointer rounded-2xl p-4 transition ${
                  isSelected
                    ? "border-2 border-cyan-500 bg-cyan-500/15 text-white shadow-lg shadow-cyan-500/20"
                    : "glass-card hover:border-white/[0.15]"
                }`}
              >
                <span className="block text-xs font-bold text-zinc-200">{src.name}</span>
                <span className="mt-1 block text-[11px] text-zinc-400">{src.desc}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-white/[0.08]">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.03] px-5 py-3 text-sm font-semibold text-zinc-300 transition hover:bg-white/[0.08] hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>

        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 px-8 py-4 text-base font-bold text-white shadow-2xl shadow-purple-600/50 transition-all hover:scale-105 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
        >
          <Sparkles className="h-5 w-5 animate-spin" />
          <span>Generate Full Video Now</span>
        </button>
      </div>
    </div>
  );
}
