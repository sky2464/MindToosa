"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus, AlertCircle, RefreshCw } from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import { Task } from "@/core/planTypes";

type Priority = "must_do" | "optional" | "normal";

const PRIORITY_CONFIG: { value: Priority; label: string; short: string; activeClass: string }[] = [
  {
    value: "must_do",
    label: "Must-do",
    short: "!",
    activeClass: "bg-red-500/10 border-red-500/30 text-red-400",
  },
  {
    value: "optional",
    label: "Optional",
    short: "~",
    activeClass: "bg-amber-500/10 border-amber-500/30 text-amber-400",
  },
  {
    value: "normal",
    label: "Normal",
    short: "·",
    activeClass: "bg-zinc-800 border-zinc-700 text-zinc-400",
  },
];

const RECURRENCE_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Once" },
  { value: "FREQ=DAILY", label: "Daily" },
  { value: "FREQ=WEEKLY", label: "Weekly" },
  { value: "FREQ=MONTHLY", label: "Monthly" },
  { value: "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR", label: "Weekdays" },
];

const TaskInput = ({ spaceId }: { spaceId: string }) => {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("normal");
  const [recurrence, setRecurrence] = useState("");
  const [showRecurrence, setShowRecurrence] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsLoading(true);
    setError("");
    try {
      const today = new Date().toISOString().split("T")[0];
      const task: Record<string, unknown> = {
        title: title.trim(),
        scheduled_for: today,
        priority,
        space_id: spaceId,
      };
      if (recurrence) task.recurrence_rule = recurrence;

      await apiClient.post<Task>("/api/tasks", task);

      setTitle("");
      setRecurrence("");
      setShowRecurrence(false);
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const activePriority = PRIORITY_CONFIG.find((p) => p.value === priority)!;

  return (
    <div className="space-y-2">
      <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
        {/* Priority cycle button */}
        <button
          type="button"
          onClick={() => {
            const idx = PRIORITY_CONFIG.findIndex((p) => p.value === priority);
            setPriority(PRIORITY_CONFIG[(idx + 1) % PRIORITY_CONFIG.length].value);
          }}
          className={`shrink-0 rounded-lg border px-2 py-1.5 text-xs font-bold transition-all ${activePriority.activeClass}`}
          title={`Priority: ${activePriority.label} (click to cycle)`}
          aria-label={`Priority: ${activePriority.label}. Click to cycle.`}
        >
          {activePriority.short}
        </button>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to be done?"
          className="w-full bg-transparent px-2 py-2 text-base text-white placeholder:text-zinc-500 focus:outline-none"
          disabled={isLoading}
          autoFocus
        />

        {/* Recurrence toggle */}
        <button
          type="button"
          onClick={() => setShowRecurrence((v) => !v)}
          className={`shrink-0 rounded-lg border p-2 transition-all ${
            recurrence
              ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-400"
              : "border-zinc-700 bg-zinc-800 text-zinc-500 hover:text-zinc-300"
          }`}
          title={
            recurrence
              ? `Repeats: ${RECURRENCE_OPTIONS.find((o) => o.value === recurrence)?.label}`
              : "Set recurrence"
          }
          aria-label="Set recurrence"
        >
          <RefreshCw size={14} />
        </button>

        <button
          type="submit"
          disabled={!title.trim() || isLoading}
          className="shrink-0 rounded-xl bg-indigo-600 p-2 text-white transition-all hover:scale-105 hover:bg-indigo-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Add task"
          title="Add task"
        >
          {isLoading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <Plus size={20} />
          )}
        </button>
      </form>

      {showRecurrence && (
        <div className="flex items-center gap-2 px-2">
          <RefreshCw size={12} className="shrink-0 text-zinc-500" />
          <select
            value={recurrence}
            onChange={(e) => setRecurrence(e.target.value)}
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-white outline-none focus:border-indigo-500/50"
            title="Recurrence"
          >
            {RECURRENCE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 px-2 text-xs text-red-400">
          <AlertCircle size={12} />
          {error}
        </div>
      )}
    </div>
  );
};

export default TaskInput;
