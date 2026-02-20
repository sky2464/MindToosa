"use client";

import { Goal } from "@/core/planTypes";
import { Calendar, Archive, Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/apiClient";
import { useToast } from "@/hooks/useToast";
import { ToastContainer } from "@/components/ui/ToastContainer";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface GoalItemProps {
    goal: Goal;
}

export default function GoalItem({ goal }: GoalItemProps) {
    const [isArchiving, setIsArchiving] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const router = useRouter();
    const { toasts, addToast, dismissToast } = useToast();

    const action = goal.archived ? "restore" : "archive";

    const handleToggleArchive = async () => {
        setShowConfirm(false);
        setIsArchiving(true);
        try {
            await apiClient.patch(`/api/goals/${goal.id}`, { archived: !goal.archived });
            router.refresh();
        } catch (error) {

            addToast(`Failed to ${action} goal. Please try again.`, "error");
        } finally {
            setIsArchiving(false);
        }
    };

    return (
        <>
            <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/40 p-6 transition hover:border-indigo-500/30 hover:bg-zinc-900/60">
                <div className="absolute top-0 right-0 p-4 flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-medium text-indigo-400 capitalize border border-indigo-500/20">
                        {goal.horizon}
                    </span>
                    <button
                        onClick={() => setShowConfirm(true)}
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
                                &quot;{goal.why}&quot;
                            </p>
                        )}
                    </div>

                    <div className="mt-8 flex items-center gap-4 text-xs font-mono text-zinc-600">
                        <span className="flex items-center gap-1.5">
                            <Calendar size={12} />
                            {goal.created_at ? new Date(goal.created_at).toLocaleDateString() : "—"}
                        </span>
                    </div>
                </div>
            </div>
            <ConfirmDialog
                isOpen={showConfirm}
                title={`${goal.archived ? "Restore" : "Archive"} North Star`}
                message={`Are you sure you want to ${action} "${goal.title}"?`}
                confirmLabel={goal.archived ? "Restore" : "Archive"}
                variant={goal.archived ? "default" : "danger"}
                onConfirm={handleToggleArchive}
                onCancel={() => setShowConfirm(false)}
            />
            <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        </>
    );
}
