"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, Video, History, Settings, Plus, PlaySquare } from "lucide-react";
import { useState, useEffect } from "react";

export function Navbar() {
  const pathname = usePathname();
  const [isBackendOnline, setIsBackendOnline] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/ping")
      .then((res) => setIsBackendOnline(res.ok))
      .catch(() => setIsBackendOnline(false));
  }, []);

  const navLinks = [
    { href: "/", label: "Dashboard", icon: Sparkles },
    { href: "/create", label: "Create Video", icon: Video },
    { href: "/videos", label: "Studio Player", icon: PlaySquare },
    { href: "/history", label: "History", icon: History },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#08080d]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <Link href="/" className="group flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 to-cyan-500 shadow-lg shadow-purple-500/25 transition-transform duration-300 group-hover:scale-105">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white">
                Shorts<span className="text-gradient">Mania</span>
              </span>
              <span className="ml-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 text-[10px] font-semibold text-purple-300">
                Turbo v1.0
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation items */}
        <nav className="hidden md:flex items-center gap-1 rounded-full border border-white/[0.06] bg-white/[0.02] p-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-purple-600/20 text-purple-300 shadow-sm border border-purple-500/30"
                    : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Status Pill & Action */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.02] px-3 py-1 text-xs">
            <span
              className={`h-2 w-2 rounded-full ${
                isBackendOnline === true
                  ? "bg-emerald-500 animate-pulse"
                  : isBackendOnline === false
                  ? "bg-amber-500"
                  : "bg-zinc-600"
              }`}
            />
            <span className="text-zinc-400">
              {isBackendOnline === true
                ? "Engine Ready"
                : isBackendOnline === false
                ? "Offline Mode"
                : "Checking..."}
            </span>
          </div>

          <Link
            href="/create"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-purple-600/30 transition-all hover:shadow-purple-600/50 hover:brightness-110 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Generate Short</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
