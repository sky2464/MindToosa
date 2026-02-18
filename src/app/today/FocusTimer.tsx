"use client";

import { useState, useEffect } from "react";

interface FocusTimerProps {
    activeTaskId?: string;
    activeTaskTitle?: string;
}

export default function FocusTimer({ activeTaskId, activeTaskTitle }: FocusTimerProps) {
    const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState<"idle" | "running" | "paused" | "completed">("idle");

    const saveSession = async () => {
        try {
            await fetch("/api/focus", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    task_id: activeTaskId,
                    started_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
                    duration_minutes: 25,
                    completed: true,
                }),
            });

            // Gamification: Award XP and Update Streak
            await fetch("/api/gamification", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "add_xp", amount: 25 }), // 1 XP per minute
            });
            await fetch("/api/gamification", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "update_streak" }),
            });

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
    }, [isActive, timeLeft]);

    const startTimer = () => {
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
        setTimeLeft(25 * 60);
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    if (mode === "idle") {
        return (
            <section className="bg-blue-50 p-6 rounded-xl text-center space-y-4">
                <h2 className="text-lg font-semibold text-blue-900">
                    {activeTaskTitle ? `Ready to focus on "${activeTaskTitle}"?` : "Ready to focus?"}
                </h2>
                <button
                    onClick={startTimer}
                    className="bg-blue-600 text-white px-6 py-3 rounded-full font-medium hover:bg-blue-700 transition w-full shadow-md hover:shadow-lg"
                >
                    Start 25m Sprint
                </button>
            </section>
        );
    }

    return (
        <section className={`p-6 rounded-xl text-center space-y-4 transition-colors duration-500 ${mode === 'running' ? 'bg-blue-900 text-white' : 'bg-blue-50 text-blue-900'}`}>
            <h2 className="text-lg font-semibold opacity-90">
                {mode === "completed" ? "Session Complete!" : mode === "paused" ? "Paused" : "Focus Mode"}
            </h2>
            {activeTaskTitle && mode !== "completed" && (
                <p className="text-sm opacity-80">Focusing on: {activeTaskTitle}</p>
            )}

            <div className="text-6xl font-bold tracking-tight font-mono my-4">
                {formatTime(timeLeft)}
            </div>

            <div className="flex justify-center gap-3">
                {mode === "running" && (
                    <button
                        onClick={pauseTimer}
                        className="bg-white/20 hover:bg-white/30 text-white px-6 py-2 rounded-full font-medium transition"
                    >
                        Pause
                    </button>
                )}

                {mode === "paused" && (
                    <button
                        onClick={startTimer}
                        className="bg-blue-600 text-white px-6 py-2 rounded-full font-medium hover:bg-blue-700 transition"
                    >
                        Resume
                    </button>
                )}

                <button
                    onClick={resetTimer}
                    className={`${mode === 'running' ? 'text-white/60 hover:text-white' : 'text-gray-500 hover:text-gray-700'} px-4 py-2 text-sm font-medium transition`}
                >
                    {mode === "completed" ? "New Session" : "Stop"}
                </button>
            </div>
        </section>
    );
}
