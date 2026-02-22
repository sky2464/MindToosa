"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, RotateCcw, X, AlertTriangle } from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import { Task } from "@/core/planTypes";

interface TrashClientProps {
  initialTasks: Task[];
}

export default function TrashClient({ initialTasks }: TrashClientProps) {
  const router = useRouter();
  const [tasks, setTasks] = useState(initialTasks);
  const [loading, setLoading] = useState<string | null>(null);

  const handleRestore = async (taskId: string) => {
    setLoading(taskId);
    try {
      await apiClient.post("/api/trash", { taskId, action: "restore" });
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      router.refresh();
    } catch {
      // ignore
    } finally {
      setLoading(null);
    }
  };

  const handlePermanentDelete = async (taskId: string, title: string) => {
    if (!confirm(`Permanently delete "${title}"? This cannot be undone.`)) return;
    setLoading(taskId);
    try {
      await apiClient.post("/api/trash", { taskId, action: "permanent_delete" });
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      router.refresh();
    } catch {
      // ignore
    } finally {
      setLoading(null);
    }
  };

  const handleEmptyTrash = async () => {
    if (!confirm(`Permanently delete all ${tasks.length} tasks? This cannot be undone.`)) return;
    try {
      await Promise.all(
        tasks.map((t) => apiClient.post("/api/trash", { taskId: t.id, action: "permanent_delete" }))
      );
      setTasks([]);
      router.refresh();
    } catch {
      // ignore
    }
  };

  return (
    <div className="container mx-auto max-w-2xl space-y-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-zinc-800 p-2">
            <Trash2 className="h-5 w-5 text-zinc-400" />
          </div>
          <div>
            <h1 className="text-foreground text-2xl font-bold">Trash</h1>
            <p className="text-muted-foreground text-xs">
              {tasks.length} deleted task{tasks.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        {tasks.length > 0 && (
          <button
            onClick={handleEmptyTrash}
            className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/10"
          >
            <AlertTriangle size={12} />
            Empty Trash
          </button>
        )}
      </div>

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="rounded-full bg-zinc-800/50 p-6">
            <Trash2 className="h-8 w-8 text-zinc-600" />
          </div>
          <p className="text-muted-foreground text-sm">Trash is empty</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <div key={task.id} className="glass-card flex items-center gap-3 rounded-xl px-4 py-3">
              <span className="flex-1 truncate text-sm text-zinc-400 line-through">
                {task.title}
              </span>
              <span className="shrink-0 text-xs text-zinc-600">{task.scheduled_for ?? "—"}</span>
              <button
                onClick={() => handleRestore(task.id!)}
                disabled={loading === task.id}
                className="shrink-0 text-zinc-500 transition-colors hover:text-green-400 disabled:opacity-40"
                aria-label={`Restore ${task.title}`}
                title="Restore"
              >
                <RotateCcw size={14} />
              </button>
              <button
                onClick={() => handlePermanentDelete(task.id!, task.title)}
                disabled={loading === task.id}
                className="shrink-0 text-zinc-500 transition-colors hover:text-red-400 disabled:opacity-40"
                aria-label={`Permanently delete ${task.title}`}
                title="Delete permanently"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
