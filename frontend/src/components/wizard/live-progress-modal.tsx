"use client";

import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, AlertCircle, Sparkles, PlaySquare, Download, X } from "lucide-react";
import { TaskProgress, TaskStageType } from "../../lib/types";
import { LogTerminal } from "../log-terminal";

interface LiveProgressModalProps {
  task: TaskProgress | null;
  isOpen: boolean;
  onClose: () => void;
}

export function LiveProgressModal({ task, isOpen, onClose }: LiveProgressModalProps) {
  const router = useRouter();
  const apiOrigin = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1").replace(/\/api\/v1\/?$/, "");

  if (!isOpen || !task) return null;

  const stages: { id: TaskStageType; label: string; step: string }[] = [
    { id: "generating_script", label: "Generating Script & Scenes", step: "1/5" },
    { id: "synthesizing_audio", label: "Synthesizing Neural Audio", step: "2/5" },
    { id: "fetching_footage", label: "Sourcing & Scaling Footage", step: "3/5" },
    { id: "syncing_captions", label: "Synchronizing ASS Captions", step: "4/5" },
    { id: "rendering_video", label: "Compositing Final MP4", step: "5/5" },
  ];

  const currentStageIndex = stages.findIndex((s) => s.id === task.stage);
  const isCompleted = task.status === "completed";
  const isFailed = task.status === "failed";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-xl animate-fadeIn">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/[0.1] bg-[#0c0c14] p-6 sm:p-8 shadow-2xl space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 to-cyan-500 shadow-lg shadow-purple-500/25">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white sm:text-xl">
                {isCompleted
                  ? "Video Generated Successfully! 🎉"
                  : isFailed
                  ? "Pipeline Encountered an Error"
                  : "Automating Your Video Pipeline..."}
              </h3>
              <p className="text-xs text-zinc-400">
                Task ID: <span className="font-mono text-purple-400">{task.task_id}</span>
              </p>
            </div>
          </div>

          {(isCompleted || isFailed) && (
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-zinc-400 hover:bg-white/[0.05] hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Progress Bar & Percentage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-zinc-300 flex items-center gap-2">
              {!isCompleted && !isFailed && <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-400" />}
              <span>{task.message}</span>
            </span>
            <span className="text-purple-400 font-mono text-sm font-bold">{task.progress}%</span>
          </div>

          <div className="h-3 w-full overflow-hidden rounded-full bg-white/[0.05] p-0.5 border border-white/[0.08]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-purple-600 via-indigo-500 to-cyan-400 transition-all duration-500 shadow-lg shadow-purple-500/50"
              style={{ width: `${task.progress}%` }}
            />
          </div>
        </div>

        {/* 5-Stage Step Flow */}
        <div className="grid grid-cols-5 gap-2 pt-2">
          {stages.map((stage, idx) => {
            const isStageComplete = isCompleted || (currentStageIndex !== -1 && idx < currentStageIndex);
            const isStageActive = !isCompleted && !isFailed && stage.id === task.stage;

            return (
              <div
                key={stage.id}
                className={`flex flex-col items-center rounded-xl p-2.5 text-center transition ${
                  isStageActive
                    ? "border border-purple-500/50 bg-purple-500/10 shadow-lg shadow-purple-500/20"
                    : isStageComplete
                    ? "border border-emerald-500/30 bg-emerald-500/5"
                    : "border border-white/[0.04] bg-white/[0.01] opacity-50"
                }`}
              >
                <div className="mb-1">
                  {isStageComplete ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : isStageActive ? (
                    <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
                  ) : (
                    <span className="text-[10px] font-bold text-zinc-500">{stage.step}</span>
                  )}
                </div>
                <span className="text-[10px] font-semibold text-zinc-200 line-clamp-2">
                  {stage.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Live Terminal Log Stream */}
        <LogTerminal logs={task.logs} defaultExpanded={true} className="border-white/[0.06]" />

        {/* Action Buttons for Completed State */}
        {isCompleted && (
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
            <a
              href={`${apiOrigin}${task.video_url}`}
              download
              className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.04] px-5 py-3 text-sm font-semibold text-zinc-200 transition hover:bg-white/[0.08] hover:text-white"
            >
              <Download className="h-4 w-4" />
              <span>Download MP4</span>
            </a>

            <button
              onClick={() => {
                onClose();
                router.push(`/videos/${task.task_id}`);
              }}
              className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-purple-600/30 transition hover:brightness-110"
            >
              <PlaySquare className="h-4 w-4" />
              <span>Open in Video Studio Player</span>
            </button>
          </div>
        )}

        {/* Error Details */}
        {isFailed && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300 space-y-1">
            <div className="flex items-center gap-2 font-bold text-rose-200">
              <AlertCircle className="h-4 w-4" />
              <span>Rendering Error Occurred</span>
            </div>
            <p>{task.error || "An unexpected error occurred during generation."}</p>
          </div>
        )}
      </div>
    </div>
  );
}
