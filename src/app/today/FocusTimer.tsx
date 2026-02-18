"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, CheckCircle2 } from "lucide-react";
import useSoundEffects from "@/hooks/useSoundEffects";

interface FocusTimerProps {
  activeTaskId?: string;
  activeTaskTitle?: string;
  onComplete?: () => void;
}

const DURATION_OPTIONS = [
  { label: "10m", minutes: 10 },
  { label: "15m", minutes: 15 },
  { label: "25m", minutes: 25 },
  { label: "45m", minutes: 45 },
];

export default function FocusTimer({ activeTaskId, onComplete }: FocusTimerProps) {
  const [selectedMinutes, setSelectedMinutes] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<"idle" | "running" | "paused" | "completed">("idle");
  const startedAtRef = useRef<Date | null>(null);

  const { playSound } = useSoundEffects();

  // Sync timeLeft when duration changes (only in idle mode)
  useEffect(() => {
    if (mode === "idle") {
      setTimeLeft(selectedMinutes * 60);
    }
  }, [selectedMinutes, mode]);

  const saveSession = async () => {
    try {
      playSound("complete");
      const actualMinutes = startedAtRef.current
        ? Math.round((Date.now() - startedAtRef.current.getTime()) / 60000)
        : selectedMinutes;

      await fetch("/api/focus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task_id: activeTaskId,
          started_at: startedAtRef.current?.toISOString() ?? new Date().toISOString(),
          duration_minutes: actualMinutes,
          completed: true,
        }),
      });

      await fetch("/api/gamification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add_xp", amount: actualMinutes }),
      });
      await fetch("/api/gamification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_streak" }),
      });

      if (onComplete) onComplete();
    } catch (error) {
      console.error("Error saving focus session:", error);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      setMode("completed");
      saveSession();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, timeLeft]);

  const startTimer = () => {
    playSound("start");
    startedAtRef.current = new Date();
    setIsActive(true);
    setMode("running");
  };

  const pauseTimer = () => {
    setIsActive(false);
    setMode("paused");
  };

  const resetTimer = () => {
    setIsActive(false);
    setMode("idle");
    setTimeLeft(selectedMinutes * 60);
    startedAtRef.current = null;
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex w-full flex-col items-center gap-4">
      {/* Duration Selector (only in idle mode) */}
      {mode === "idle" && (
        <div className="flex items-center gap-1.5">
          {DURATION_OPTIONS.map(({ label, minutes }) => (
            <button
              key={minutes}
              onClick={() => setSelectedMinutes(minutes)}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${selectedMinutes === minutes
                  ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/30"
                  : "text-zinc-600 hover:text-zinc-400"
                }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <div
        className={`font-mono text-6xl font-black tracking-tight transition-colors duration-500 ${isActive ? "text-indigo-400 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]" : "text-zinc-600"}`}
      >
        {formatTime(timeLeft)}
      </div>

      <div className="flex items-center gap-4">
        {mode === "idle" || mode === "paused" ? (
          <button
            onClick={startTimer}
            className="group flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-2 font-bold text-white shadow-lg shadow-indigo-500/20 transition-all hover:scale-105 hover:bg-indigo-500 active:scale-95"
          >
            <Play size={18} className="fill-current" />
            {mode === "paused" ? "Resume" : "Start Focus"}
          </button>
        ) : mode === "running" ? (
          <button
            onClick={pauseTimer}
            className="flex items-center gap-2 rounded-full bg-zinc-800 px-6 py-2 font-medium text-zinc-300 transition-all hover:bg-zinc-700"
          >
            <Pause size={18} className="fill-current" />
            Pause
          </button>
        ) : (
          <div className="flex animate-pulse items-center gap-2 font-bold text-emerald-400">
            <CheckCircle2 size={20} /> Session Complete
          </div>
        )}

        {mode !== "idle" && mode !== "completed" && (
          <button
            onClick={resetTimer}
            className="rounded-full p-2 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
            title="Reset Timer"
          >
            <RotateCcw size={18} />
          </button>
        )}

        {mode === "completed" && (
          <button
            onClick={resetTimer}
            className="text-sm text-zinc-500 underline underline-offset-4 hover:text-white"
          >
            Start New Session
          </button>
        )}
      </div>
    </div>
  );
}
