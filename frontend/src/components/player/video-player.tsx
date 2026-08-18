"use client";

import { useState, useRef, useEffect } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  RotateCcw,
  Download,
  Copy,
  Check,
  Smartphone,
  Monitor,
  Share2,
} from "lucide-react";
import { TaskProgress } from "../../lib/types";
import { formatDuration } from "../../lib/utils";

interface VideoPlayerProps {
  task: TaskProgress;
}

export function VideoPlayer({ task }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(task.video_duration || 0);
  const [volume, setVolume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const isVertical = task.video_aspect === "9:16";
  const apiOrigin = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1").replace(/\/api\/v1\/?$/, "");
  const videoSrc = task.video_url?.startsWith("http")
    ? task.video_url
    : `${apiOrigin}${task.video_url || ""}`;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    const onLoadedMetadata = () => setDuration(video.duration);
    const onEnded = () => setIsPlaying(false);

    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("ended", onEnded);

    return () => {
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("ended", onEnded);
    };
  }, [task]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    if (videoRef.current) {
      videoRef.current.volume = vol;
      videoRef.current.muted = vol === 0;
      setIsMuted(vol === 0);
    }
  };

  const changeSpeed = () => {
    const speeds = [1.0, 1.25, 1.5, 2.0];
    const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setPlaybackRate(nextSpeed);
    if (videoRef.current) {
      videoRef.current.playbackRate = nextSpeed;
    }
  };

  const replay = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = 0;
    videoRef.current.play();
    setIsPlaying(true);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const copyScript = () => {
    if (!task.script) return;
    const scriptText = task.script.scenes.map((s) => s.narration).join("\n\n");
    navigator.clipboard.writeText(scriptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start animate-fadeIn">
      {/* Video Canvas Container */}
      <div className="lg:col-span-7 flex flex-col items-center">
        <div
          ref={containerRef}
          className={`relative group overflow-hidden rounded-3xl border border-white/[0.12] bg-black shadow-2xl transition-all ${
            isVertical ? "w-full max-w-[360px] aspect-[9/16]" : "w-full aspect-[16/9]"
          }`}
        >
          {/* Native HTML5 Video Element */}
          <video
            ref={videoRef}
            src={videoSrc}
            playsInline
            onClick={togglePlay}
            className="h-full w-full object-cover cursor-pointer"
          />

          {/* Aspect & Resolution Badge */}
          <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full border border-white/[0.15] bg-black/60 px-3 py-1 text-xs font-semibold backdrop-blur-md text-white">
            {isVertical ? <Smartphone className="h-3.5 w-3.5 text-purple-400" /> : <Monitor className="h-3.5 w-3.5 text-cyan-400" />}
            <span>{isVertical ? "9:16 (1080x1920)" : "16:9 (1920x1080)"}</span>
          </div>

          {/* Center Play Overlay Button */}
          {!isPlaying && (
            <button
              onClick={togglePlay}
              className="absolute inset-0 m-auto flex h-16 w-16 items-center justify-center rounded-full bg-purple-600/90 text-white shadow-2xl shadow-purple-600/50 backdrop-blur-md transition-transform hover:scale-110 active:scale-95"
            >
              <Play className="h-8 w-8 ml-1" />
            </button>
          )}

          {/* Bottom Player Controls Bar */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 transition-opacity duration-300 space-y-2">
            {/* Timeline Progress Bar */}
            <input
              type="range"
              min="0"
              max={duration || 100}
              step="0.1"
              value={currentTime}
              onChange={handleSeek}
              className="w-full accent-purple-500 cursor-pointer h-1.5 bg-white/20 rounded-lg"
            />

            <div className="flex items-center justify-between text-xs text-white">
              <div className="flex items-center gap-3">
                <button onClick={togglePlay} className="p-1 hover:text-purple-400 transition">
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </button>

                <button onClick={replay} className="p-1 hover:text-purple-400 transition" title="Replay">
                  <RotateCcw className="h-4 w-4" />
                </button>

                <div className="flex items-center gap-1.5">
                  <button onClick={toggleMute} className="p-1 hover:text-purple-400 transition">
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-14 accent-purple-500 cursor-pointer h-1 bg-white/20 rounded-lg hidden sm:inline-block"
                  />
                </div>

                <span className="font-mono text-[11px] text-zinc-300">
                  {formatDuration(currentTime)} / {formatDuration(duration)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={changeSpeed}
                  className="rounded px-1.5 py-0.5 font-mono text-[11px] font-bold border border-white/20 hover:border-purple-400 transition"
                  title="Playback Speed"
                >
                  {playbackRate}x
                </button>

                <button onClick={toggleFullscreen} className="p-1 hover:text-purple-400 transition">
                  <Maximize className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Video Details & Actions Sidebar */}
      <div className="lg:col-span-5 space-y-6">
        {/* Title & Metadata */}
        <div className="glass-panel rounded-3xl p-6 space-y-4">
          <div className="space-y-1">
            <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-0.5 text-xs font-semibold text-purple-300">
              ShortsMania Rendered Video
            </span>
            <h1 className="text-xl font-bold text-white sm:text-2xl pt-1">
              {task.title || "Generated Short Video"}
            </h1>
            <p className="text-xs text-zinc-400">
              Duration: {formatDuration(task.video_duration)} • Format: {task.video_aspect} • Ready for TikTok, Shorts & Reels
            </p>
          </div>

          {/* Primary Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <a
              href={videoSrc}
              download={`${task.title.replace(/[^a-zA-Z0-9]/g, "_") || "shortsmania"}.mp4`}
              className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-cyan-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-purple-600/30 transition hover:brightness-110"
            >
              <Download className="h-4 w-4" />
              <span>Download MP4</span>
            </a>

            <button
              onClick={copyScript}
              className="flex items-center justify-center gap-2 rounded-2xl border border-white/[0.1] bg-white/[0.04] px-4 py-3 text-sm font-semibold text-zinc-200 transition hover:bg-white/[0.08] hover:text-white"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              <span>{copied ? "Copied Script" : "Copy Script"}</span>
            </button>
          </div>
        </div>

        {/* Scene Breakdown Transcript */}
        {task.script && task.script.scenes && (
          <div className="glass-panel rounded-3xl p-6 space-y-3">
            <h3 className="text-sm font-bold text-zinc-200">Scene Breakdown & Voiceover Transcript</h3>
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {task.script.scenes.map((scene, idx) => (
                <div key={idx} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-xs space-y-1">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span className="font-bold text-purple-400">Scene {scene.index}</span>
                    <span>~{scene.duration.toFixed(1)}s</span>
                  </div>
                  <p className="text-zinc-200 leading-relaxed">{scene.narration}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
