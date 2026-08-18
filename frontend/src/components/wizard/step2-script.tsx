"use client";

import { useState } from "react";
import { Sparkles, Plus, Trash2, Tag, RefreshCw, ArrowLeft, ArrowRight, Layers, Clock } from "lucide-react";
import { GenerateVideoRequest, SceneItem } from "../../lib/types";
import { generateScript } from "../../lib/api";

interface Step2Props {
  formData: GenerateVideoRequest;
  updateForm: (updates: Partial<GenerateVideoRequest>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function Step2Script({ formData, updateForm, onNext, onBack }: Step2Props) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [newTagInput, setNewTagInput] = useState<{ [key: number]: string }>({});

  const scenes: SceneItem[] = formData.scenes && formData.scenes.length > 0
    ? formData.scenes
    : [
        {
          index: 1,
          narration: `Did you know this mind-blowing fact about ${formData.prompt || "this topic"}?`,
          visual_keywords: [formData.prompt || "mystery", "shock", "viral"],
          duration: 4.5,
        },
        {
          index: 2,
          narration: "Scientists discovered that over eighty percent of people completely misunderstand how it works.",
          visual_keywords: ["discovery", "science", "curiosity"],
          duration: 6.0,
        },
        {
          index: 3,
          narration: "Double tap if you learned something new, and subscribe for more daily facts!",
          visual_keywords: ["subscribe", "smartphone", "glow"],
          duration: 4.5,
        },
      ];

  const handleGenerateScript = async () => {
    setIsGenerating(true);
    try {
      const result = await generateScript({
        prompt: formData.prompt,
        tone: formData.script_tone,
        duration: formData.video_length,
        language: formData.language,
      });
      updateForm({ scenes: result.scenes });
    } catch (err: any) {
      alert("Failed to generate script: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const updateSceneNarration = (index: number, text: string) => {
    const updated = scenes.map((s, i) => (i === index ? { ...s, narration: text } : s));
    updateForm({ scenes: updated });
  };

  const updateSceneDuration = (index: number, dur: number) => {
    const updated = scenes.map((s, i) => (i === index ? { ...s, duration: dur } : s));
    updateForm({ scenes: updated });
  };

  const addTagToScene = (sceneIndex: number) => {
    const tag = (newTagInput[sceneIndex] || "").trim();
    if (!tag) return;
    const updated = scenes.map((s, i) => {
      if (i === sceneIndex) {
        return { ...s, visual_keywords: [...s.visual_keywords, tag] };
      }
      return s;
    });
    updateForm({ scenes: updated });
    setNewTagInput({ ...newTagInput, [sceneIndex]: "" });
  };

  const removeTagFromScene = (sceneIndex: number, tagIndex: number) => {
    const updated = scenes.map((s, i) => {
      if (i === sceneIndex) {
        const nextTags = s.visual_keywords.filter((_, idx) => idx !== tagIndex);
        return { ...s, visual_keywords: nextTags };
      }
      return s;
    });
    updateForm({ scenes: updated });
  };

  const addScene = () => {
    const newScene: SceneItem = {
      index: scenes.length + 1,
      narration: "Enter narration for this new scene...",
      visual_keywords: ["cinematic", "abstract"],
      duration: 4.0,
    };
    updateForm({ scenes: [...scenes, newScene] });
  };

  const deleteScene = (index: number) => {
    if (scenes.length <= 1) return;
    const updated = scenes
      .filter((_, i) => i !== index)
      .map((s, i) => ({ ...s, index: i + 1 }));
    updateForm({ scenes: updated });
  };

  const totalWords = scenes.reduce((acc, s) => acc + s.narration.split(/\s+/).filter(Boolean).length, 0);
  const totalDuration = scenes.reduce((acc, s) => acc + s.duration, 0);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            2. AI Script Studio & Scene Breakdown
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            Review and edit your scene narration, footage keywords, and timing.
          </p>
        </div>

        <button
          type="button"
          onClick={handleGenerateScript}
          disabled={isGenerating}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-600/30 transition hover:brightness-110 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isGenerating ? "animate-spin" : ""}`} />
          <span>{isGenerating ? "Synthesizing AI Script..." : "Re-Generate Script"}</span>
        </button>
      </div>

      {/* Script Overview Badges */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 text-xs">
        <div className="flex items-center gap-1.5 text-zinc-300">
          <Layers className="h-4 w-4 text-purple-400" />
          <span className="font-semibold">{scenes.length} Scenes</span>
        </div>
        <span className="text-zinc-600">•</span>
        <div className="flex items-center gap-1.5 text-zinc-300">
          <span className="font-semibold">{totalWords} Words</span>
        </div>
        <span className="text-zinc-600">•</span>
        <div className="flex items-center gap-1.5 text-zinc-300">
          <Clock className="h-4 w-4 text-cyan-400" />
          <span className="font-semibold">~{totalDuration.toFixed(1)}s Total Duration</span>
        </div>
      </div>

      {/* Scenes List */}
      <div className="space-y-4">
        {scenes.map((scene, sceneIdx) => (
          <div
            key={sceneIdx}
            className="glass-card rounded-2xl p-5 space-y-4 border border-white/[0.08] transition hover:border-purple-500/30"
          >
            {/* Scene Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-600/20 text-xs font-bold text-purple-300 border border-purple-500/30">
                  #{scene.index}
                </span>
                <span className="text-sm font-semibold text-zinc-200">
                  Scene {scene.index}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <span>Duration:</span>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    step="0.5"
                    value={scene.duration}
                    onChange={(e) => updateSceneDuration(sceneIdx, parseFloat(e.target.value) || 3)}
                    className="glass-input w-16 rounded-lg px-2 py-1 text-center text-xs font-bold"
                  />
                  <span>s</span>
                </div>

                {scenes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => deleteScene(sceneIdx)}
                    className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-rose-500/10 hover:text-rose-400"
                    title="Delete Scene"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Narration Textarea */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-400">
                Spoken Voiceover Narration:
              </label>
              <textarea
                rows={2}
                value={scene.narration}
                onChange={(e) => updateSceneNarration(sceneIdx, e.target.value)}
                className="glass-input w-full rounded-xl p-3 text-sm placeholder-zinc-500 leading-relaxed"
                placeholder="What the AI narrator will say in this scene..."
              />
            </div>

            {/* Visual Keywords for footage sourcing */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                <Tag className="h-3.5 w-3.5 text-cyan-400" />
                <span>Stock Footage Search Keywords:</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {scene.visual_keywords.map((tag, tagIdx) => (
                  <span
                    key={tagIdx}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-xs font-medium text-cyan-300"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => removeTagFromScene(sceneIdx, tagIdx)}
                      className="text-cyan-400 hover:text-white"
                    >
                      ×
                    </button>
                  </span>
                ))}

                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    placeholder="Add keyword..."
                    value={newTagInput[sceneIdx] || ""}
                    onChange={(e) => setNewTagInput({ ...newTagInput, [sceneIdx]: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTagToScene(sceneIdx);
                      }
                    }}
                    className="glass-input h-7 rounded-lg px-2.5 text-xs placeholder-zinc-500 w-28"
                  />
                  <button
                    type="button"
                    onClick={() => addTagToScene(sceneIdx)}
                    className="rounded-lg border border-white/[0.08] bg-white/[0.04] p-1.5 text-zinc-400 hover:text-white"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Scene Button */}
      <button
        type="button"
        onClick={addScene}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/[0.1] bg-white/[0.01] p-4 text-sm font-semibold text-zinc-400 transition hover:border-purple-500/50 hover:bg-purple-500/5 hover:text-purple-300"
      >
        <Plus className="h-4 w-4" />
        <span>Add Another Scene</span>
      </button>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4">
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
          onClick={() => {
            updateForm({ scenes });
            onNext();
          }}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-purple-600/30 transition hover:brightness-110"
        >
          <span>Continue to Voice & Audio</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
