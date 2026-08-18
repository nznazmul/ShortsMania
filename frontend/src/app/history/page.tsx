"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { History, Trash2, Search, Filter, Plus, RefreshCw, HardDrive } from "lucide-react";
import { TaskProgress } from "../../lib/types";
import { listTasks, deleteTask } from "../../lib/api";
import { VideoCard } from "../../components/player/video-card";

export default function HistoryPage() {
  const [tasks, setTasks] = useState<TaskProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const loadHistory = () => {
    setLoading(true);
    listTasks()
      .then(setTasks)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleDelete = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this video project?")) return;
    try {
      await deleteTask(taskId);
      setTasks(tasks.filter((t) => t.task_id !== taskId));
    } catch (err: any) {
      alert("Delete failed: " + err.message);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      (t.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.task_id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === "all" || t.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const completedCount = tasks.filter((t) => t.status === "completed").length;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-300">
            Project Archives & Storage
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl pt-1">
            Generation History
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadHistory}
            className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-white/[0.08] hover:text-white transition"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </button>

          <Link
            href="/create"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-purple-600/30 hover:brightness-110 transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create New</span>
          </Link>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="glass-card rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-400">Total Projects</span>
            <span className="block text-2xl font-bold text-white">{tasks.length}</span>
          </div>
          <History className="h-6 w-6 text-purple-400" />
        </div>

        <div className="glass-card rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-400">Completed Videos</span>
            <span className="block text-2xl font-bold text-emerald-400">{completedCount}</span>
          </div>
          <HardDrive className="h-6 w-6 text-emerald-400" />
        </div>

        <div className="glass-card rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-400">Storage Optimization</span>
            <span className="block text-2xl font-bold text-cyan-400">Active</span>
          </div>
          <span className="text-xs text-zinc-500">Auto H.264 Cleanup</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search projects by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="glass-input w-full rounded-xl pl-10 pr-4 py-2 text-xs placeholder-zinc-500"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 rounded-xl border border-white/[0.08] bg-white/[0.02] p-1 text-xs">
          {["all", "completed", "processing", "failed"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`rounded-lg px-3 py-1.5 font-semibold capitalize transition ${
                filterStatus === status
                  ? "bg-purple-600 text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Video Cards */}
      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 animate-pulse rounded-3xl bg-white/[0.02]" />
          ))}
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="glass-panel rounded-3xl p-16 text-center space-y-3">
          <h3 className="text-base font-bold text-white">No Matching Videos Found</h3>
          <p className="text-xs text-zinc-400">Try adjusting your search query or filter status.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTasks.map((t) => (
            <VideoCard key={t.task_id} task={t} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
