"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Play,
  ArrowRight,
  Zap,
  Mic,
  Film,
  Type,
  Video,
  Layers,
  Flame,
  Globe2,
} from "lucide-react";
import { TaskProgress } from "../lib/types";
import { listTasks, createTask } from "../lib/api";
import { VideoCard } from "../components/player/video-card";
import { LiveProgressModal } from "../components/wizard/live-progress-modal";
import { useTaskProgress } from "../hooks/use-task-progress";

export default function DashboardPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<TaskProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  const { task: activeTask } = useTaskProgress(activeTaskId, () => {
    // Reload tasks list when active task completes
    listTasks().then(setTasks).catch(() => {});
  });

  useEffect(() => {
    listTasks()
      .then(setTasks)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const quickTemplates = [
    {
      title: "🌌 Deep Space Wonders",
      prompt: "3 Mind-Blowing Facts About Supermassive Black Holes",
      tone: "Viral",
      dur: 15,
      gradient: "from-purple-600 to-indigo-700",
      desc: "Cosmic mysteries with cinematic space visuals",
    },
    {
      title: "🤖 Future AI 2030",
      prompt: "How Quantum AI Will Transform Healthcare in 5 Years",
      tone: "Tech",
      dur: 15,
      gradient: "from-cyan-500 to-blue-700",
      desc: "Cutting-edge futuristic technology breakdown",
    },
    {
      title: "🧠 Psychology Hacks",
      prompt: "The Optical Illusion That Reveals Your Personality",
      tone: "Storytelling",
      dur: 15,
      gradient: "from-fuchsia-600 to-pink-700",
      desc: "High-retention psychological mind tricks",
    },
    {
      title: "💰 Wealth Formula",
      prompt: "How The Top 1% Allocate Their Wealth For Maximum Growth",
      tone: "Finance",
      dur: 15,
      gradient: "from-amber-500 to-orange-700",
      desc: "Strategic compound growth insights",
    },
  ];

  const handleLaunchQuickTemplate = async (template: typeof quickTemplates[0]) => {
    try {
      const created = await createTask({
        prompt: template.prompt,
        video_aspect: "9:16",
        video_length: template.dur,
        script_tone: template.tone as any,
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
        footage_source: "pexels",
      });
      setActiveTaskId(created.task_id);
    } catch (err: any) {
      alert("Failed to start task: " + err.message);
    }
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(tasks.filter((t) => t.task_id !== taskId));
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 space-y-16 animate-fadeIn">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center text-center space-y-6 pt-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-xs font-semibold text-purple-300 backdrop-blur-md">
          <Sparkles className="h-3.5 w-3.5" />
          <span>MoneyPrinterTurbo Full-Stack Edition</span>
        </div>

        <h1 className="max-w-4xl text-4xl font-extrabold tracking-tight text-white sm:text-6xl sm:leading-[1.15]">
          Automate Viral Short Videos with <span className="text-gradient">AI Superpowers</span>
        </h1>

        <p className="max-w-2xl text-base text-zinc-400 sm:text-lg">
          Turn any topic into high-retention TikToks, YouTube Shorts, and Reels in seconds.
          AI scriptwriting, neural voiceovers, HD footage sourcing, and karaoke typography—all rendered via FFmpeg.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
          <Link
            href="/create"
            className="flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 px-8 py-4 text-base font-bold text-white shadow-2xl shadow-purple-600/40 transition-all hover:scale-105 hover:brightness-110 active:scale-95"
          >
            <Zap className="h-5 w-5 fill-white" />
            <span>Launch Video Creator Wizard</span>
          </Link>

          <Link
            href="/videos"
            className="flex items-center gap-2 rounded-2xl border border-white/[0.1] bg-white/[0.04] px-7 py-4 text-base font-semibold text-zinc-200 transition hover:bg-white/[0.08] hover:text-white"
          >
            <Play className="h-4 w-4" />
            <span>Open Studio Player</span>
          </Link>
        </div>
      </section>

      {/* 5-Step Pipeline Feature Highlights */}
      <section className="space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-xs font-bold uppercase tracking-widest text-purple-400">
            End-to-End Autonomous Pipeline
          </h2>
          <h3 className="text-2xl font-bold text-white sm:text-3xl">How ShortsMania Prints Videos</h3>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { step: "01", title: "AI Script Studio", icon: Sparkles, desc: "Scene breakdown, hooks, and stock search keywords." },
            { step: "02", title: "Neural Voiceover", icon: Mic, desc: "Natural Edge-TTS audio with word boundary timestamps." },
            { step: "03", title: "HD Footage Match", icon: Film, desc: "Pexels API & fallback procedural canvas motion." },
            { step: "04", title: "Karaoke Captions", icon: Type, desc: "Custom ASS typography with illuminated word highlight." },
            { step: "05", title: "FFmpeg Composition", icon: Video, desc: "Audio ducking, transitions, scaling, and fast H.264 MP4." },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="glass-card rounded-3xl p-5 border border-white/[0.07] space-y-3 transition hover:border-purple-500/30"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.05] text-purple-400">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-mono font-bold text-zinc-600">{item.step}</span>
                </div>
                <h4 className="text-sm font-bold text-zinc-200">{item.title}</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 1-Click Quick Generation Presets */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white sm:text-2xl">⚡ 1-Click Viral Generation Presets</h3>
            <p className="text-xs text-zinc-400">Click any preset to launch instant automated video generation</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickTemplates.map((template, idx) => (
            <div
              key={idx}
              className="glass-card group relative overflow-hidden rounded-3xl p-6 border border-white/[0.08] transition hover:border-purple-500/40 hover:shadow-2xl"
            >
              <div className="space-y-3">
                <span className="text-lg font-bold text-white block">{template.title}</span>
                <p className="text-xs text-zinc-400 line-clamp-2">{template.prompt}</p>
                <p className="text-[11px] text-zinc-500">{template.desc}</p>
              </div>

              <button
                type="button"
                onClick={() => handleLaunchQuickTemplate(template)}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-white/[0.05] py-2.5 text-xs font-bold text-zinc-200 border border-white/[0.08] transition hover:bg-purple-600 hover:text-white hover:border-purple-500"
              >
                <Flame className="h-3.5 w-3.5 text-purple-400" />
                <span>Generate Video Now</span>
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Generations Library */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white sm:text-2xl">Recent Video Projects</h3>
            <p className="text-xs text-zinc-400">{tasks.length} videos generated</p>
          </div>

          <Link
            href="/history"
            className="flex items-center gap-1.5 text-xs font-semibold text-purple-400 hover:text-purple-300 transition"
          >
            <span>View All History</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 animate-pulse rounded-3xl bg-white/[0.02]" />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="glass-panel rounded-3xl p-12 text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-600/10 text-purple-400 border border-purple-500/20">
              <Video className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-white">No Videos Generated Yet</h4>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                Create your first automated short video using the multi-step wizard or a 1-click template.
              </p>
            </div>
            <Link
              href="/create"
              className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-purple-500 transition"
            >
              <span>Create First Video</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {tasks.slice(0, 6).map((t) => (
              <VideoCard key={t.task_id} task={t} onDelete={handleDeleteTask} />
            ))}
          </div>
        )}
      </section>

      {/* Real-Time Live Pipeline Progress Modal */}
      <LiveProgressModal
        task={activeTask}
        isOpen={Boolean(activeTaskId)}
        onClose={() => setActiveTaskId(null)}
      />
    </div>
  );
}
