"use client";

import { useState, useEffect, useRef } from "react";
import { Mic, Volume2, Play, Pause, Music, Sliders, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { GenerateVideoRequest, VoiceItem, BgmItem } from "../../lib/types";
import { getVoices, previewVoice, getBgmList } from "../../lib/api";

interface Step3Props {
  formData: GenerateVideoRequest;
  updateForm: (updates: Partial<GenerateVideoRequest>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function Step3Audio({ formData, updateForm, onNext, onBack }: Step3Props) {
  const [voices, setVoices] = useState<VoiceItem[]>([]);
  const [bgmList, setBgmList] = useState<BgmItem[]>([]);
  const [loadingVoices, setLoadingVoices] = useState(true);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [playingBgmId, setPlayingBgmId] = useState<string | null>(null);

  const voiceAudioRef = useRef<HTMLAudioElement | null>(null);
  const bgmAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [voiceData, bgmData] = await Promise.all([getVoices(), getBgmList()]);
        setVoices(voiceData);
        setBgmList(bgmData);
      } catch {
        // Fallback default voice list
        setVoices([
          { id: "en-US-ChristopherNeural", name: "Christopher (Deep / Authoritative)", language: "English (US)", gender: "Male", locale: "en-US", provider: "edge-tts" },
          { id: "en-US-JennyNeural", name: "Jenny (Natural / Friendly)", language: "English (US)", gender: "Female", locale: "en-US", provider: "edge-tts" },
          { id: "en-US-GuyNeural", name: "Guy (Conversational)", language: "English (US)", gender: "Male", locale: "en-US", provider: "edge-tts" },
          { id: "en-GB-RyanNeural", name: "Ryan (British Accent)", language: "English (UK)", gender: "Male", locale: "en-GB", provider: "edge-tts" },
          { id: "en-GB-SoniaNeural", name: "Sonia (British Accent)", language: "English (UK)", gender: "Female", locale: "en-GB", provider: "edge-tts" },
        ]);
        setBgmList([
          { id: "ambient_synth", name: "Ambient Cyberpunk Synth", category: "Ambient", duration: 60, file_path: "", preview_url: "/media/bgm/ambient_synth.mp3" },
          { id: "lofi_chill", name: "Chill Lo-Fi Study Beats", category: "Lo-Fi", duration: 60, file_path: "", preview_url: "/media/bgm/lofi_chill.mp3" },
          { id: "cinematic_rise", name: "Cinematic Suspense Tension", category: "Cinematic", duration: 60, file_path: "", preview_url: "/media/bgm/cinematic_rise.mp3" },
        ]);
      } finally {
        setLoadingVoices(false);
      }
    }
    loadData();
  }, []);

  const handlePlayVoicePreview = async (voiceId: string) => {
    if (playingVoiceId === voiceId && voiceAudioRef.current) {
      voiceAudioRef.current.pause();
      setPlayingVoiceId(null);
      return;
    }

    try {
      setPlayingVoiceId(voiceId);
      const url = await previewVoice(voiceId, "Welcome to ShortsMania. Create viral automated AI videos in seconds.");
      if (voiceAudioRef.current) {
        voiceAudioRef.current.src = url;
        voiceAudioRef.current.play();
        voiceAudioRef.current.onended = () => setPlayingVoiceId(null);
      }
    } catch {
      setPlayingVoiceId(null);
    }
  };

  const handlePlayBgm = (track: BgmItem) => {
    if (playingBgmId === track.id && bgmAudioRef.current) {
      bgmAudioRef.current.pause();
      setPlayingBgmId(null);
      return;
    }

    setPlayingBgmId(track.id);
    if (bgmAudioRef.current) {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
      bgmAudioRef.current.src = `${apiBase}/media/bgm/${track.id}.mp3`;
      bgmAudioRef.current.volume = formData.bgm_volume;
      bgmAudioRef.current.play();
      bgmAudioRef.current.onended = () => setPlayingBgmId(null);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <audio ref={voiceAudioRef} className="hidden" />
      <audio ref={bgmAudioRef} className="hidden" />

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          3. Voiceover & Audio Engine
        </h2>
        <p className="mt-1 text-sm text-zinc-400">
          Pick a high-fidelity neural voice, adjust speech rate, and select background music with auto-ducking.
        </p>
      </div>

      {/* Voice Selection */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
            <Mic className="h-4 w-4 text-purple-400" />
            <span>Select AI Narrator Voice</span>
          </label>
          <span className="text-xs text-zinc-500">{voices.length} neural voices available</span>
        </div>

        {loadingVoices ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-white/[0.02]" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {voices.map((v) => {
              const isSelected = formData.voice_name === v.id;
              const isPlaying = playingVoiceId === v.id;

              return (
                <div
                  key={v.id}
                  onClick={() => updateForm({ voice_name: v.id })}
                  className={`group relative flex cursor-pointer items-center justify-between rounded-2xl p-4 transition ${
                    isSelected
                      ? "border-2 border-purple-500 bg-purple-500/15 text-white shadow-lg shadow-purple-500/20"
                      : "glass-card hover:border-white/[0.15]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayVoicePreview(v.id);
                      }}
                      className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${
                        isPlaying
                          ? "bg-purple-500 text-white animate-pulse"
                          : "bg-white/[0.08] text-purple-300 hover:bg-purple-600 hover:text-white"
                      }`}
                      title="Audition Voice"
                    >
                      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
                    </button>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-zinc-200">{v.name}</span>
                        {isSelected && <Check className="h-4 w-4 text-purple-400" />}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-zinc-400">{v.language}</span>
                        <span className="text-zinc-600">•</span>
                        <span className="rounded bg-white/[0.06] px-1.5 py-0.2 text-[10px] text-zinc-400">
                          {v.gender}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Voice Controls: Speed & Pitch */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
        {/* Speed */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-zinc-300">Speaking Speed</span>
            <span className="text-purple-400 font-mono">{formData.voice_rate.toFixed(2)}x</span>
          </div>
          <input
            type="range"
            min="0.75"
            max="1.5"
            step="0.05"
            value={formData.voice_rate}
            onChange={(e) => updateForm({ voice_rate: parseFloat(e.target.value) })}
            className="w-full accent-purple-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-zinc-500">
            <span>0.75x (Relaxed)</span>
            <span>1.0x (Standard)</span>
            <span>1.5x (Fast Viral)</span>
          </div>
        </div>

        {/* Pitch */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-zinc-300">Voice Pitch Adjustment</span>
            <span className="text-cyan-400 font-mono">
              {formData.voice_pitch > 0 ? `+${formData.voice_pitch}` : formData.voice_pitch} Hz
            </span>
          </div>
          <input
            type="range"
            min="-20"
            max="20"
            step="2"
            value={formData.voice_pitch}
            onChange={(e) => updateForm({ voice_pitch: parseInt(e.target.value) })}
            className="w-full accent-cyan-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-zinc-500">
            <span>-20Hz (Deeper)</span>
            <span>0Hz (Default)</span>
            <span>+20Hz (Higher)</span>
          </div>
        </div>
      </div>

      {/* Background Music Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
            <Music className="h-4 w-4 text-cyan-400" />
            <span>Background Music & Audio Ducking</span>
          </label>
        </div>

        {/* BGM Tracks Grid */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {bgmList.map((track) => {
            const isSelected = formData.bgm_type === track.id;
            const isPlaying = playingBgmId === track.id;

            return (
              <div
                key={track.id}
                onClick={() => updateForm({ bgm_type: track.id })}
                className={`flex cursor-pointer items-center justify-between rounded-2xl p-4 transition ${
                  isSelected
                    ? "border-2 border-cyan-500 bg-cyan-500/15 text-white shadow-lg shadow-cyan-500/20"
                    : "glass-card hover:border-white/[0.15]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayBgm(track);
                    }}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                      isPlaying
                        ? "bg-cyan-500 text-white animate-pulse"
                        : "bg-white/[0.08] text-cyan-300 hover:bg-cyan-600 hover:text-white"
                    }`}
                  >
                    {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 ml-0.5" />}
                  </button>
                  <div>
                    <span className="block text-xs font-bold text-zinc-200">{track.name}</span>
                    <span className="text-[10px] text-zinc-400">{track.category}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* BGM Ducking Volume */}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-zinc-300">
              <Volume2 className="h-3.5 w-3.5 text-cyan-400" />
              <span>BGM Volume (Auto-Ducked Behind Voiceover)</span>
            </span>
            <span className="text-cyan-400 font-mono">
              {Math.round(formData.bgm_volume * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0.0"
            max="0.5"
            step="0.02"
            value={formData.bgm_volume}
            onChange={(e) => updateForm({ bgm_volume: parseFloat(e.target.value) })}
            className="w-full accent-cyan-500 cursor-pointer"
          />
          <span className="block text-[10px] text-zinc-500">
            Recommended: 15% - 22% for optimal narration clarity and background energy.
          </span>
        </div>
      </div>

      {/* Navigation */}
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
          onClick={onNext}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-purple-600/30 transition hover:brightness-110"
        >
          <span>Continue to Captions & Styling</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
