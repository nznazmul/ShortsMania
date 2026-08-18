"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { TaskProgress } from "../../../lib/types";
import { getTask } from "../../../lib/api";
import { VideoPlayer } from "../../../components/player/video-player";

export default function SingleVideoPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [task, setTask] = useState<TaskProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getTask(resolvedParams.id)
      .then(setTask)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [resolvedParams.id]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 space-y-6 animate-fadeIn">
      {/* Top back navigation */}
      <div className="flex items-center gap-3">
        <Link
          href="/videos"
          className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-white/[0.08] hover:text-white transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to All Videos</span>
        </Link>
      </div>

      {loading ? (
        <div className="flex h-96 items-center justify-center rounded-3xl bg-white/[0.02] animate-pulse">
          <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
        </div>
      ) : error || !task ? (
        <div className="glass-panel rounded-3xl p-12 text-center space-y-3">
          <AlertCircle className="mx-auto h-10 w-10 text-rose-400" />
          <h3 className="text-lg font-bold text-white">Video Not Found</h3>
          <p className="text-xs text-zinc-400">{error || "Could not load video metadata."}</p>
        </div>
      ) : (
        <VideoPlayer task={task} />
      )}
    </div>
  );
}
