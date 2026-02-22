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
        <div className="absolute top-0 right-0 flex items-center gap-2 p-4">
          <span className="inline-flex items-center rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-0.5 text-xs font-medium text-indigo-400 capitalize">
            {goal.horizon}
          </span>
          <button
            onClick={() => setShowConfirm(true)}
            disabled={isArchiving}
            className={`rounded-lg p-1.5 transition-colors disabled:opacity-50 ${
              goal.archived
                ? "text-emerald-500 hover:bg-emerald-500/10"
                : "text-zinc-600 hover:bg-red-400/10 hover:text-red-400"
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

        <div className="flex h-full flex-col justify-between">
          <div className="pr-16">
            <h3 className="mb-2 text-xl font-bold tracking-tight text-white uppercase transition-colors group-hover:text-indigo-400">
              {goal.title}
            </h3>
            {goal.why && (
              <p className="border-l-2 border-indigo-500/30 py-1 pl-3 text-sm text-zinc-400 italic">
                &quot;{goal.why}&quot;
              </p>
            )}
          </div>

          <div className="mt-8 flex items-center gap-4 font-mono text-xs text-zinc-600">
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
