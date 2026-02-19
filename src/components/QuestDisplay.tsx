"use client";

import { useEffect, useState } from "react";
import { Trophy, Flame, Zap } from "lucide-react";
import { apiClient } from "@/lib/apiClient";

interface UserStats {
  xp: number;
  level: number;
  current_streak: number;
}

export default function QuestDisplay() {
  const [stats, setStats] = useState<UserStats | null>(null);

  useEffect(() => {
    apiClient.get<UserStats>("/api/gamification")
      .then((data) => {
        setStats(data);
      })
      .catch(() => setStats(null));
  }, []);

  if (!stats) return null;

  const progress = (stats.xp % 500) / 5; // Assuming 500 XP per level

  return (
    <div className="glass-panel group relative mb-8 flex flex-col items-center justify-between gap-6 overflow-hidden rounded-2xl p-6 md:flex-row">
      {/* Ambient Background Glow for Stats */}
      <div className="absolute top-0 right-0 -z-10 h-64 w-64 rounded-full bg-indigo-600/10 blur-3xl transition-all duration-700 group-hover:bg-indigo-600/20"></div>

      <div className="z-10 flex items-center gap-6">
        <div className="relative">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/20">
            <span className="text-2xl font-bold text-white">{stats.level}</span>
          </div>
          <div className="absolute -right-2 -bottom-2 rounded-full border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-[10px] font-bold text-zinc-400">
            LVL
          </div>
        </div>

        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold text-white">
            <Trophy size={16} className="text-yellow-400" />
            Grand Master Flow
          </h3>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-2 w-32 overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 transition-all duration-1000"
                ref={(el) => { if (el) el.style.width = `${progress}%`; }}
              />
            </div>
            <span className="font-mono text-xs text-zinc-500">{stats.xp} XP</span>
          </div>
        </div>
      </div>

      <div className="z-10 flex gap-4">
        <div className="flex min-w-[80px] flex-col items-center rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 backdrop-blur-sm">
          <Flame size={20} className="animate-pulse-slow mb-1 text-orange-500" />
          <span className="text-xl leading-none font-bold text-white">{stats.current_streak}</span>
          <span className="text-[10px] tracking-wider text-zinc-500 uppercase">Streak</span>
        </div>
        <div className="flex min-w-[80px] flex-col items-center rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 backdrop-blur-sm">
          <Zap size={20} className="mb-1 text-yellow-400" />
          <span className="text-xl leading-none font-bold text-white">Focus</span>
          <span className="text-[10px] tracking-wider text-zinc-500 uppercase">Mode</span>
        </div>
      </div>
    </div>
  );
}
