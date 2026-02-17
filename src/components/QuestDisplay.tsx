"use client";

import { useEffect, useState } from "react";

interface UserStats {
    xp: number;
    level: number;
    current_streak: number;
}

export default function QuestDisplay() {
    const [stats, setStats] = useState<UserStats | null>(null);

    useEffect(() => {
        fetch("/api/gamification")
            .then((res) => res.json())
            .then((data) => {
                if (!data.error) setStats(data);
            })
            .catch((err) => console.error("Failed to load quest stats", err));
    }, []);

    if (!stats) return null;

    return (
        <div className="bg-slate-900 text-white p-4 rounded-xl shadow-lg flex items-center justify-between mb-6 border border-slate-700">
            <div className="flex items-center gap-4">
                <div className="relative">
                    <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center font-bold text-lg border-2 border-indigo-400">
                        {stats.level}
                    </div>
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] bg-slate-800 px-1 rounded uppercase tracking-wider text-indigo-300">Lvl</span>
                </div>
                <div>
                    <h3 className="font-bold text-sm text-indigo-200">Quest Progress</h3>
                    <p className="text-xs text-slate-400">{stats.xp} XP / Next Lvl: {stats.level * 500}</p>
                    <div className="w-32 h-2 bg-slate-700 rounded-full mt-1 overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                            style={{ width: `${Math.min(100, (stats.xp % 500) / 5)}%` }} // Approximate progress visual
                        />
                    </div>
                </div>
            </div>

            <div className="text-center">
                <div className="text-2xl">🔥</div>
                <div className="text-xs font-bold text-orange-400">{stats.current_streak} Day Streak</div>
            </div>
        </div>
    );
}
