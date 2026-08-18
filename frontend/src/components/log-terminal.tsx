"use client";

import { useState, useRef, useEffect } from "react";
import { Terminal, Copy, Check, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { TaskLogEntry } from "../lib/types";

interface LogTerminalProps {
  logs: TaskLogEntry[];
  title?: string;
  className?: string;
  defaultExpanded?: boolean;
}

export function LogTerminal({
  logs,
  title = "Real-Time Pipeline Logs",
  className = "",
  defaultExpanded = true,
}: LogTerminalProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const copyAllLogs = () => {
    const text = logs
      .map((l) => `[${l.timestamp}] [${l.stage.toUpperCase()}] ${l.message}`)
      .join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case "success":
        return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
      case "error":
        return "text-rose-400 bg-rose-500/10 border-rose-500/30";
      case "warning":
        return "text-amber-400 bg-amber-500/10 border-amber-500/30";
      default:
        return "text-cyan-400 bg-cyan-500/10 border-cyan-500/30";
    }
  };

  return (
    <div className={`overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0c0c14] shadow-2xl ${className}`}>
      {/* Terminal Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.02] px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-rose-500/80 inline-block" />
            <span className="h-3 w-3 rounded-full bg-amber-500/80 inline-block" />
            <span className="h-3 w-3 rounded-full bg-emerald-500/80 inline-block" />
          </div>
          <div className="ml-2 flex items-center gap-2 text-xs font-mono text-zinc-400">
            <Terminal className="h-3.5 w-3.5 text-purple-400" />
            <span className="font-semibold text-zinc-200">{title}</span>
            <span className="text-[10px] text-zinc-500">({logs.length} events)</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={copyAllLogs}
            className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-xs text-zinc-400 transition hover:bg-white/[0.08] hover:text-white"
            title="Copy Logs"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="rounded-lg p-1 text-zinc-400 transition hover:bg-white/[0.08] hover:text-white"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Terminal Body */}
      {isExpanded && (
        <div
          ref={scrollRef}
          className="max-h-60 overflow-y-auto p-4 font-mono text-xs leading-relaxed text-zinc-300 space-y-1.5"
        >
          {logs.length === 0 ? (
            <div className="py-6 text-center text-zinc-600">Waiting for task initialization...</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="flex items-start gap-2.5 transition-colors hover:bg-white/[0.02] p-0.5 rounded">
                <span className="text-zinc-500 select-none">[{log.timestamp}]</span>
                <span
                  className={`rounded border px-1.5 py-0.2 text-[10px] uppercase font-semibold select-none ${getLevelBadge(
                    log.level
                  )}`}
                >
                  {log.stage.replace("_", " ")}
                </span>
                <span className="text-zinc-300 break-words flex-1">{log.message}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
