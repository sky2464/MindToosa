"use client";

import { Goal } from "@/core/planTypes";
import { Calendar, Archive, Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface GoalItemProps {
    goal: Goal;
}

export default function GoalItem({ goal }: GoalItemProps) {
    const [isArchiving, setIsArchiving] = useState(false);
    const router = useRouter();

    const handleToggleArchive = async () => {
        const action = goal.archived ? "restore" : "archive";
        if (!confirm(`Are you sure you want to ${action} this North Star?`)) return;

        setIsArchiving(true);
        try {
            const res = await fetch(`/api/goals/${goal.id}`, {
                method: "PATCH",
                body: JSON.stringify({ archived: !goal.archived }),
                headers: { "Content-Type": "application/json" },
            });

            if (!res.ok) throw new Error(`Failed to ${action} goal`);

            router.refresh();
        } catch (error) {
            console.error(`Error during goal ${action}:`, error);
            alert(`Failed to ${action} goal. Please try again.`);
        } finally {
            setIsArchiving(false);
        }
    };

    return (
        <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/40 p-6 transition hover:border-indigo-500/30 hover:bg-zinc-900/60">
            <div className="absolute top-0 right-0 p-4 flex items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-medium text-indigo-400 capitalize border border-indigo-500/20">
                    {goal.horizon}
                </span>
                <button
                    onClick={handleToggleArchive}
                    disabled={isArchiving}
                    className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${goal.archived
                        ? "text-emerald-500 hover:bg-emerald-500/10"
                        : "text-zinc-600 hover:text-red-400 hover:bg-red-400/10"
                        }`}
                    title={goal.archived ? "Restore North Star" : "Archive North Star"}
                    aria-label={goal.archived ? "Restore North Star" : "Archive North Star"}
                >
                    {isArchiving ? (
                        <Loader2 size={16} className="animate-spin" />
                    ) : goal.archived ? (
                        <Plus size={16} />
                    ) : (
                        <Archive size={16} />
                    )}
                </button>
            </div>

            <div className="flex flex-col h-full justify-between">
                <div className="pr-16">
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors uppercase tracking-tight">
                        {goal.title}
                    </h3>
                    {goal.why && (
                        <p className="text-zinc-400 text-sm italic border-l-2 border-indigo-500/30 pl-3 py-1">
                            "{goal.why}"
                        </p>
                    )}
                </div>

                <div className="mt-8 flex items-center gap-4 text-xs font-mono text-zinc-600">
                    <span className="flex items-center gap-1.5">
                        <Calendar size={12} />
                        {new Date(goal.created_at!).toLocaleDateString()}
                    </span>
                </div>
            </div>
        </div>
    );
}
