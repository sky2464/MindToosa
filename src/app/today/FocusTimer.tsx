"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, CheckCircle2, Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSoundEffects } from "@/hooks/useSoundEffects"; // Ensure this hook exists or mock it if needed

interface FocusTimerProps {
    activeTaskId?: string;
    activeTaskTitle?: string;
}

export default function FocusTimer({ activeTaskId, activeTaskTitle }: FocusTimerProps) {
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState<"idle" | "running" | "paused" | "completed">("idle");
    const [zenMode, setZenMode] = useState(false);

    // Sound hooks
    const { playStart, playPause, playComplete, playClick } = useSoundEffects();

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

            // Gamification endpoints (fire and forget)
            fetch("/api/gamification", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "add_xp", amount: 25 }),
            });
            fetch("/api/gamification", {
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
            playComplete();
            saveSession();
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isActive, timeLeft, playComplete]);

    const startTimer = () => {
        setIsActive(true);
        setMode("running");
        playStart();
    };

    const pauseTimer = () => {
        setIsActive(false);
        setMode("paused");
        playPause();
    };

    const resetTimer = () => {
        setIsActive(false);
        setMode("idle");
        setTimeLeft(25 * 60);
        playClick();
    };

    const toggleZenMode = () => {
        setZenMode(!zenMode);
        playClick();
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    const progress = ((25 * 60 - timeLeft) / (25 * 60)) * 100;

    return (
        <AnimatePresence>
            {zenMode && isActive && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center p-8"
                >
                    <TimerDisplay
                        timeLeft={timeLeft}
                        progress={progress}
                        mode={mode}
                        isActive={isActive}
                        formatTime={formatTime}
                    />
                    <div className="mt-12 flex gap-6">
                        <ControlButton onClick={pauseTimer} icon={<Pause className="w-6 h-6" />} label="Pause" />
                        <ControlButton onClick={toggleZenMode} icon={<Minimize2 className="w-6 h-6" />} label="Exit Zen" />
                    </div>
                </motion.div>
            )}

            <div className={cn(
                "relative p-8 rounded-3xl transition-all duration-500 overflow-hidden",
                mode === 'running' ? "bg-primary/10 border border-primary/20 shadow-2xl shadow-primary/10" : "bg-card border border-border shadow-lg"
            )}>
                {/* Breathing Background Effect */}
                {isActive && (
                    <motion.div
                        animate={{ opacity: [0.3, 0.6, 0.3], scale: [0.95, 1.05, 0.95] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-transparent to-accent/20 blur-3xl -z-10"
                    />
                )}

                <div className="flex justify-between items-start mb-8">
                    <h2 className="text-xl font-semibold text-foreground/90">
                        {mode === "completed" ? "Session Complete!" : mode === "paused" ? "Focus Paused" : "Deep Focus"}
                    </h2>
                    {isActive && (
                        <button onClick={toggleZenMode} className="text-muted-foreground hover:text-primary transition">
                            <Maximize2 className="w-5 h-5" />
                        </button>
                    )}
                </div>

                <div className="flex flex-col items-center justify-center py-6">
                    <div className="relative mb-8">
                        {/* Circular Progress (Visual only for now, can be SVG) */}
                        <div className="w-64 h-64 rounded-full border-4 border-muted/20 flex items-center justify-center relative">
                            {isActive && (
                                <motion.div
                                    animate={{ scale: [1, 1.02, 1] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                    className="absolute inset-0 rounded-full border-4 border-primary/50 opacity-50"
                                />
                            )}
                            <div className="text-7xl font-bold font-mono tracking-tighter text-foreground">
                                {formatTime(timeLeft)}
                            </div>
                        </div>
                    </div>

                    {activeTaskTitle && mode !== "completed" && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-secondary/50 px-4 py-2 rounded-full text-sm text-secondary-foreground/80 mb-8 border border-white/5"
                        >
                            Focusing on: <span className="font-medium text-primary-foreground">{activeTaskTitle}</span>
                        </motion.div>
                    )}

                    <div className="flex gap-4">
                        {mode === "idle" || mode === "paused" ? (
                            <ControlButton
                                onClick={startTimer}
                                icon={<Play className="w-6 h-6 ml-1" />}
                                label={mode === "idle" ? "Start Sprint" : "Resume"}
                                primary
                            />
                        ) : mode === "running" ? (
                            <ControlButton
                                onClick={pauseTimer}
                                icon={<Pause className="w-6 h-6" />}
                                label="Pause"
                            />
                        ) : null}

                        {(mode !== "idle") && (
                            <ControlButton
                                onClick={resetTimer}
                                icon={mode === "completed" ? <RotateCcw className="w-5 h-5" /> : <RotateCcw className="w-5 h-5" />}
                                label={mode === "completed" ? "New Session" : "Stop"}
                            />
                        )}
                    </div>
                </div>
            </div>
        </AnimatePresence>
    );
}

function TimerDisplay({ timeLeft, formatTime, isActive }: any) {
    return (
        <div className="relative">
            {isActive && (
                <motion.div
                    animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-0 bg-primary/20 blur-3xl rounded-full"
                />
            )}
            <div className="text-9xl font-bold font-mono text-foreground tracking-tighter">
                {formatTime(timeLeft)}
            </div>
        </div>
    )
}

function ControlButton({ onClick, icon, label, primary }: any) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-200 active:scale-95",
                primary
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:text-foreground"
            )}
        >
            {icon}
            <span>{label}</span>
        </button>
    )
}
