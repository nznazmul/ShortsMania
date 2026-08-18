"use client";

import Link from "next/link";
import { Play, Download, Trash2, Clock, Smartphone, Monitor, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { TaskProgress } from "../../lib/types";
import { formatDuration, formatDate } from "../../lib/utils";

interface VideoCardProps {
  task: TaskProgress;
  onDelete?: (taskId: string) => void;
}

export function VideoCard({ task, onDelete }: VideoCardProps) {
  const isVertical = task.video_aspect === "9:16";
  const isCompleted = task.status === "completed";
  const isFailed = task.status === "failed";
  const isProcessing = task.status === "processing" || task.status === "pending";

  const apiOrigin = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1").replace(/\/api\/v1\/?$/, "");
  const videoUrl = task.video_url?.startsWith("http")
    ? task.video_url
    : `${apiOrigin}${task.video_url || ""}`;

  return (
    <div className="glass-card group relative flex flex-col overflow-hidden rounded-3xl border border-white/[0.08] transition hover:border-purple-500/40">
      {/* Thumbnail / Video Preview Area */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-zinc-950">
        {isCompleted && task.video_url ? (
          <video
            src={videoUrl}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            muted
            onMouseOver={(e) => (e.target as HTMLVideoElement).play().catch(() => {})}
            onMouseOut={(e) => {
              const v = e.target as HTMLVideoElement;
              v.pause();
              v.currentTime = 0;
            }}
          />
        ) : isProcessing ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-purple-950/20 p-4 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
            <span className="text-xs font-semibold text-purple-300">{task.message}</span>
          </div>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-rose-950/20 p-4 text-center">
            <AlertCircle className="h-8 w-8 text-rose-400" />
            <span className="text-xs font-semibold text-rose-300">Generation Failed</span>
          </div>
        )}

        {/* Duration Badge */}
        {task.video_duration && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/80 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-md">
            <Clock className="h-3 w-3 text-purple-400" />
            <span>{formatDuration(task.video_duration)}</span>
          </div>
        )}

        {/* Format Badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-black/80 px-2.5 py-1 text-[11px] font-semibold text-zinc-300 backdrop-blur-md">
          {isVertical ? <Smartphone className="h-3 w-3 text-purple-400" /> : <Monitor className="h-3 w-3 text-cyan-400" />}
          <span>{task.video_aspect}</span>
        </div>
      </div>

      {/* Card Content */}
      <div className="flex flex-1 flex-col justify-between p-5 space-y-4">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-white line-clamp-1 group-hover:text-purple-300 transition">
            {task.title || "Untitled Video"}
          </h3>
          <p className="text-xs text-zinc-500">{formatDate(task.created_at)}</p>
        </div>

        {/* Card Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
          {isCompleted ? (
            <Link
              href={`/videos/${task.task_id}`}
              className="flex items-center gap-1.5 text-xs font-bold text-purple-400 hover:text-purple-300 transition"
            >
              <Play className="h-3.5 w-3.5" />
              <span>Open in Studio</span>
            </Link>
          ) : (
            <span className="text-xs text-zinc-500">Status: {task.status}</span>
          )}

          <div className="flex items-center gap-2">
            {isCompleted && task.video_url && (
              <a
                href={videoUrl}
                download
                className="rounded-lg p-2 text-zinc-400 hover:bg-white/[0.08] hover:text-white transition"
                title="Download Video"
              >
                <Download className="h-4 w-4" />
              </a>
            )}

            {onDelete && (
              <button
                onClick={() => onDelete(task.task_id)}
                className="rounded-lg p-2 text-zinc-500 hover:bg-rose-500/10 hover:text-rose-400 transition"
                title="Delete Video"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
