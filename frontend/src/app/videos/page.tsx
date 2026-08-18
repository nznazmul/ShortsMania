"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PlaySquare, Video, ArrowLeft, Plus } from "lucide-react";
import { TaskProgress } from "../../lib/types";
import { listTasks } from "../../lib/api";
import { VideoPlayer } from "../../components/player/video-player";

export default function VideosPage() {
  const [tasks, setTasks] = useState<TaskProgress[]>([]);
  const [selectedTask, setSelectedTask] = useState<TaskProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listTasks()
      .then((data) => {
        const completed = data.filter((t) => t.status === "completed" && t.video_url);
        setTasks(completed);
        if (completed.length > 0) {
          setSelectedTask(completed[0]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-300">
            Playback & Export Studio
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl pt-1">
            Video Studio Player
          </h1>
        </div>

        <Link
          href="/create"
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-purple-600/30 hover:brightness-110 transition"
        >
          <Plus className="h-4 w-4" />
          <span>New Video</span>
        </Link>
      </div>

      {loading ? (
        <div className="h-96 animate-pulse rounded-3xl bg-white/[0.02]" />
      ) : tasks.length === 0 ? (
        <div className="glass-panel rounded-3xl p-16 text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-600/10 text-purple-400 border border-purple-500/20">
            <Video className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">No Rendered Videos Available</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              Generate a short video first using the creation wizard to preview and download it here.
            </p>
          </div>
          <Link
            href="/create"
            className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-3 text-sm font-bold text-white hover:bg-purple-500 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Generate Video Now</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Active Video Player */}
          {selectedTask && <VideoPlayer task={selectedTask} />}

          {/* Quick Switcher Carousel */}
          {tasks.length > 1 && (
            <div className="space-y-3 pt-6 border-t border-white/[0.08]">
              <h3 className="text-sm font-bold text-zinc-300">Switch Video Project</h3>
              <div className="flex items-center gap-3 overflow-x-auto pb-3">
                {tasks.map((t) => {
                  const isCurrent = selectedTask?.task_id === t.task_id;
                  return (
                    <button
                      key={t.task_id}
                      onClick={() => setSelectedTask(t)}
                      className={`flex-shrink-0 flex items-center gap-2.5 rounded-2xl p-3 text-left transition ${
                        isCurrent
                          ? "border-2 border-purple-500 bg-purple-500/15 text-white"
                          : "glass-card hover:border-white/[0.2] text-zinc-400"
                      }`}
                    >
                      <PlaySquare className="h-4 w-4 text-purple-400" />
                      <div className="max-w-[180px]">
                        <span className="block text-xs font-bold truncate text-zinc-200">{t.title}</span>
                        <span className="text-[10px] text-zinc-500">{t.video_aspect}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
