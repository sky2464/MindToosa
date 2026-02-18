"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { goalService } from "@/server/services/goalService";
import { useRouter } from "next/navigation";

interface GoalFormProps {
    spaceId: string;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export default function GoalForm({ spaceId, onSuccess, onCancel }: GoalFormProps) {
    const [title, setTitle] = useState("");
    const [horizon, setHorizon] = useState<"week" | "month" | "year" | "life">("week");
    const [why, setWhy] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        setIsLoading(true);
        try {
            const res = await fetch("/api/goals", {
                method: "POST",
                body: JSON.stringify({
                    title,
                    horizon,
                    why,
                    space_id: spaceId,
                }),
                headers: { "Content-Type": "application/json" },
            });

            if (!res.ok) {
                throw new Error("Failed to create goal");
            }

            setTitle("");
            setWhy("");
            setHorizon("week");
            router.refresh();
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error("Error creating goal:", error);
            alert("Failed to create goal. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-white/10 bg-zinc-900/50 p-6 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">New North Star</h3>
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="text-zinc-500 hover:text-white"
                    >
                        <X size={20} />
                    </button>
                )}
            </div>

            <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Title</label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="What is your focus?"
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    required
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Time Horizon</label>
                    <select
                        value={horizon}
                        onChange={(e) => setHorizon(e.target.value as any)}
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                        <option value="week">Week</option>
                        <option value="month">Month</option>
                        <option value="year">Year</option>
                        <option value="life">Life</option>
                    </select>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">The "Why"</label>
                <textarea
                    value={why}
                    onChange={(e) => setWhy(e.target.value)}
                    placeholder="Why does this matter?"
                    rows={3}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
            </div>

            <button
                type="submit"
                disabled={isLoading || !title.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-500 disabled:opacity-50"
            >
                {isLoading ? "Creating..." : (
                    <>
                        <Plus size={18} />
                        <span>Create Goal</span>
                    </>
                )}
            </button>
        </form>
    );
}
