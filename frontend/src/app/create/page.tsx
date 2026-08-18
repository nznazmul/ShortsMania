"use client";

import { useState } from "react";
import { Sparkles, CheckCircle2 } from "lucide-react";
import { GenerateVideoRequest } from "../../lib/types";
import { createTask } from "../../lib/api";
import { Step1Prompt } from "../../components/wizard/step1-prompt";
import { Step2Script } from "../../components/wizard/step2-script";
import { Step3Audio } from "../../components/wizard/step3-audio";
import { Step4Subtitles } from "../../components/wizard/step4-subtitles";
import { LiveProgressModal } from "../../components/wizard/live-progress-modal";
import { useTaskProgress } from "../../hooks/use-task-progress";

export default function CreateVideoPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  const [formData, setFormData] = useState<GenerateVideoRequest>({
    prompt: "Why The Deep Ocean Is Terrifying",
    video_aspect: "9:16",
    video_length: 15,
    script_tone: "Viral",
    language: "English",
    voice_name: "en-US-ChristopherNeural",
    voice_rate: 1.0,
    voice_pitch: 0,
    bgm_type: "ambient_synth",
    bgm_volume: 0.18,
    subtitle_style: {
      font_name: "Arial",
      font_size: 28,
      primary_color: "#FFFFFF",
      highlight_color: "#FFD700",
      outline_color: "#000000",
      outline_width: 2,
      shadow_color: "#000000",
      position: "bottom",
      animation: "karaoke_word",
    },
    custom_script: null,
    scenes: null,
    footage_source: "pexels",
  });

  const { task: activeTask } = useTaskProgress(activeTaskId);

  const updateForm = (updates: Partial<GenerateVideoRequest>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    try {
      const created = await createTask(formData);
      setActiveTaskId(created.task_id);
    } catch (err: any) {
      alert("Failed to submit task: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { num: 1, label: "Concept & Format" },
    { num: 2, label: "Script Studio" },
    { num: 3, label: "Voice & Audio" },
    { num: 4, label: "Captions & Style" },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-8 space-y-10 animate-fadeIn">
      {/* Header & Stepper Progress */}
      <div className="space-y-6 text-center">
        <div className="space-y-1">
          <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-300">
            Multi-Step AI Production Wizard
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Create AI Short Video
          </h1>
        </div>

        {/* Stepper Header Navigation */}
        <div className="grid grid-cols-4 gap-2 pt-2">
          {steps.map((s) => {
            const isActive = currentStep === s.num;
            const isDone = currentStep > s.num;

            return (
              <div
                key={s.num}
                onClick={() => isDone && setCurrentStep(s.num)}
                className={`flex flex-col items-center gap-1.5 rounded-2xl p-3 text-center transition ${
                  isDone ? "cursor-pointer" : ""
                } ${
                  isActive
                    ? "border-2 border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/20"
                    : isDone
                    ? "border border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/60"
                    : "border border-white/[0.04] bg-white/[0.01] opacity-50"
                }`}
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold">
                  {isDone ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  ) : (
                    <span
                      className={`h-5 w-5 rounded-full flex items-center justify-center text-[11px] ${
                        isActive ? "bg-purple-600 text-white" : "bg-white/[0.1] text-zinc-400"
                      }`}
                    >
                      {s.num}
                    </span>
                  )}
                </div>
                <span className="text-xs font-semibold text-zinc-200 hidden sm:inline">
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Wizard Form Container */}
      <div className="glass-panel rounded-3xl p-6 sm:p-10 shadow-2xl border border-white/[0.08]">
        {currentStep === 1 && (
          <Step1Prompt
            formData={formData}
            updateForm={updateForm}
            onNext={() => setCurrentStep(2)}
          />
        )}

        {currentStep === 2 && (
          <Step2Script
            formData={formData}
            updateForm={updateForm}
            onNext={() => setCurrentStep(3)}
            onBack={() => setCurrentStep(1)}
          />
        )}

        {currentStep === 3 && (
          <Step3Audio
            formData={formData}
            updateForm={updateForm}
            onNext={() => setCurrentStep(4)}
            onBack={() => setCurrentStep(2)}
          />
        )}

        {currentStep === 4 && (
          <Step4Subtitles
            formData={formData}
            updateForm={updateForm}
            onSubmit={handleFinalSubmit}
            onBack={() => setCurrentStep(3)}
            isSubmitting={isSubmitting}
          />
        )}
      </div>

      {/* Real-Time Live Pipeline Progress Modal */}
      <LiveProgressModal
        task={activeTask}
        isOpen={Boolean(activeTaskId)}
        onClose={() => setActiveTaskId(null)}
      />
    </div>
  );
}
