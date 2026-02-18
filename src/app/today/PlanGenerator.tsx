"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2, X, CheckCircle2, AlertCircle, Zap, Battery, BatteryLow, BatteryMedium } from "lucide-react";
import { Task } from "@/core/planTypes";

interface PlanGeneratorProps {
    spaceId: string;
}

type EnergyLevel = "low" | "medium" | "high";

interface GeneratedPlan {
    date: string;
    mustDo: Task[];
    optional: Task[];
    notes?: string;
}

const DURATION_OPTIONS = [120, 240, 360, 480];
const DURATION_LABELS: Record<number, string> = {
    120: "2h",
    240: "4h",
    360: "6h",
    480: "8h",
};

export default function PlanGenerator({ spaceId }: PlanGeneratorProps) {
    const [open, setOpen] = useState(false);
    const [rebootMode, setRebootMode] = useState(false);
    const [timeAvailable, setTimeAvailable] = useState(480);
    const [energyLevel, setEnergyLevel] = useState<EnergyLevel>("medium");
    const [constraints, setConstraints] = useState("");
    const [notes, setNotes] = useState("");
    const [loading, setLoading] = useState(false);
    const [plan, setPlan] = useState<GeneratedPlan | null>(null);
    const [applying, setApplying] = useState(false);
    const [applied, setApplied] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const generatePlan = async () => {
        setLoading(true);
        setError("");
        setPlan(null);
        try {
            const res = await fetch("/api/plan/daily", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    timeAvailable,
                    constraints: constraints ? constraints.split(",").map((s) => s.trim()) : [],
                    notes: notes + (rebootMode ? ` [REBOOT MODE: energy=${energyLevel}]` : ` [energy=${energyLevel}]`),
                }),
            });
            if (!res.ok) {
                const data = await res.json();
                setError(data.error || "Failed to generate plan");
                return;
            }
            const data = await res.json();
            setPlan(data);
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const applyPlan = async () => {
        if (!plan) return;
        setApplying(true);
        try {
            // Inject spaceId into tasks that don't have one
            const withSpace = (tasks: Task[]) =>
                tasks.map((t) => ({ ...t, space_id: t.space_id || spaceId }));

            const res = await fetch("/api/plan/apply", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...plan,
                    mustDo: withSpace(plan.mustDo),
                    optional: withSpace(plan.optional),
                }),
            });
            if (!res.ok) {
                const data = await res.json();
                setError(data.error || "Failed to apply plan");
                return;
            }
            setApplied(true);
            router.refresh();
            setTimeout(() => {
                setOpen(false);
                setApplied(false);
                setPlan(null);
            }, 1500);
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setApplying(false);
        }
    };

    const EnergyIcon = energyLevel === "low" ? BatteryLow : energyLevel === "medium" ? BatteryMedium : Battery;

    if (!open) {
        return (
            <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-indigo-600/20 border border-indigo-500/30 px-4 py-2.5 text-sm font-bold text-indigo-300 transition-all hover:bg-indigo-600/30 hover:text-indigo-200"
            >
                <Sparkles size={16} className="animate-pulse" />
                Generate Plan
            </button>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-zinc-950 shadow-2xl shadow-indigo-500/10">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
                    <div className="flex items-center gap-2">
                        <Sparkles size={18} className="text-indigo-400" />
                        <h2 className="font-bold text-white">
                            {rebootMode ? "🔄 Reboot Mode" : "Generate Today's Plan"}
                        </h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setRebootMode(!rebootMode)}
                            className={`rounded-lg px-3 py-1 text-xs font-bold transition-all ${rebootMode
                                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                    : "text-zinc-500 hover:text-zinc-300"
                                }`}
                        >
                            {rebootMode ? "Reboot ON" : "I'm behind"}
                        </button>
                        <button
                            onClick={() => { setOpen(false); setPlan(null); setError(""); }}
                            className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-5">
                    {!plan ? (
                        <>
                            {rebootMode && (
                                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-sm text-amber-300">
                                    Reboot mode creates a salvage plan with 1–3 tasks for your remaining time.
                                </div>
                            )}

                            {/* Time Available */}
                            <div>
                                <label className="mb-2 block text-xs font-bold tracking-widest text-zinc-500 uppercase">
                                    Time Available
                                </label>
                                <div className="flex gap-2">
                                    {DURATION_OPTIONS.map((d) => (
                                        <button
                                            key={d}
                                            onClick={() => setTimeAvailable(d)}
                                            className={`flex-1 rounded-xl py-2 text-sm font-bold transition-all ${timeAvailable === d
                                                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                                                    : "border border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:text-zinc-300"
                                                }`}
                                        >
                                            {DURATION_LABELS[d]}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Energy Level */}
                            <div>
                                <label className="mb-2 block text-xs font-bold tracking-widest text-zinc-500 uppercase">
                                    Energy Level
                                </label>
                                <div className="flex gap-2">
                                    {(["low", "medium", "high"] as EnergyLevel[]).map((level) => (
                                        <button
                                            key={level}
                                            onClick={() => setEnergyLevel(level)}
                                            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-bold capitalize transition-all ${energyLevel === level
                                                    ? level === "low"
                                                        ? "bg-red-500/20 text-red-300 border border-red-500/30"
                                                        : level === "medium"
                                                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                                            : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                                    : "border border-zinc-700 bg-zinc-800/50 text-zinc-500 hover:text-zinc-300"
                                                }`}
                                        >
                                            <EnergyIcon size={14} />
                                            {level}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Constraints */}
                            <div>
                                <label className="mb-2 block text-xs font-bold tracking-widest text-zinc-500 uppercase">
                                    Fixed Commitments (optional)
                                </label>
                                <input
                                    type="text"
                                    value={constraints}
                                    onChange={(e) => setConstraints(e.target.value)}
                                    placeholder="e.g. Team meeting 2pm, School pickup 4pm"
                                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900/50 px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30"
                                />
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="mb-2 block text-xs font-bold tracking-widest text-zinc-500 uppercase">
                                    Notes (optional)
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Anything else the AI should know..."
                                    rows={2}
                                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900/50 px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 resize-none"
                                />
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
                                    <AlertCircle size={16} />
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={generatePlan}
                                disabled={loading}
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-500 disabled:opacity-50"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={18} />
                                        Generate Plan
                                    </>
                                )}
                            </button>
                        </>
                    ) : (
                        /* Plan Preview */
                        <div className="space-y-4">
                            {applied ? (
                                <div className="flex flex-col items-center gap-3 py-8 text-center">
                                    <CheckCircle2 size={48} className="text-emerald-400" />
                                    <p className="text-lg font-bold text-white">Plan Applied!</p>
                                    <p className="text-sm text-zinc-500">Your tasks are ready. Let's flow.</p>
                                </div>
                            ) : (
                                <>
                                    {plan.mustDo.length > 0 && (
                                        <div>
                                            <h3 className="mb-2 text-xs font-bold tracking-widest text-red-400 uppercase">
                                                Must-Do ({plan.mustDo.length})
                                            </h3>
                                            <div className="space-y-2">
                                                {plan.mustDo.map((task, i) => (
                                                    <div key={i} className="rounded-xl border border-red-500/10 bg-red-500/5 px-4 py-3">
                                                        <p className="font-medium text-white">{task.title}</p>
                                                        <p className="text-xs text-zinc-500">{task.estimated_minutes}m · {task.micro_steps?.length ?? 0} steps</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {plan.optional.length > 0 && (
                                        <div>
                                            <h3 className="mb-2 text-xs font-bold tracking-widest text-amber-400 uppercase">
                                                Optional ({plan.optional.length})
                                            </h3>
                                            <div className="space-y-2">
                                                {plan.optional.map((task, i) => (
                                                    <div key={i} className="rounded-xl border border-amber-500/10 bg-amber-500/5 px-4 py-3">
                                                        <p className="font-medium text-white">{task.title}</p>
                                                        <p className="text-xs text-zinc-500">{task.estimated_minutes}m · {task.micro_steps?.length ?? 0} steps</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {plan.notes && (
                                        <p className="text-sm text-zinc-500 italic">{plan.notes}</p>
                                    )}

                                    {error && (
                                        <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
                                            <AlertCircle size={16} />
                                            {error}
                                        </div>
                                    )}

                                    <div className="flex gap-3 pt-2">
                                        <button
                                            onClick={() => { setPlan(null); setError(""); }}
                                            className="flex-1 rounded-xl border border-zinc-700 bg-zinc-800/50 py-2.5 text-sm font-medium text-zinc-400 transition hover:text-zinc-300"
                                        >
                                            Regenerate
                                        </button>
                                        <button
                                            onClick={applyPlan}
                                            disabled={applying}
                                            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-500 disabled:opacity-50"
                                        >
                                            {applying ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} className="fill-current" />}
                                            Apply Plan
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
