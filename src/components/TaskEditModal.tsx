"use client";

import { useState } from "react";
import { Task } from "@/core/planTypes";
import { useRouter } from "next/navigation";
import { X, Trash2, Archive, Save, Loader2, AlertCircle } from "lucide-react";

interface TaskEditModalProps {
    task: Task;
    onClose: () => void;
}

const PRIORITY_OPTIONS: { value: Task["priority"]; label: string; color: string }[] = [
    { value: "must_do", label: "Must-do", color: "text-red-400 border-red-500/30 bg-red-500/10" },
    { value: "optional", label: "Optional", color: "text-amber-400 border-amber-500/30 bg-amber-500/10" },
    { value: "normal", label: "Normal", color: "text-zinc-400 border-zinc-700 bg-zinc-800/50" },
];

export default function TaskEditModal({ task, onClose }: TaskEditModalProps) {
    const router = useRouter();
    const [title, setTitle] = useState(task.title);
    const [priority, setPriority] = useState<Task["priority"]>(task.priority ?? "normal");
    const [estimatedMinutes, setEstimatedMinutes] = useState(task.estimated_minutes ?? 25);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState("");

    const handleSave = async () => {
        if (!title.trim()) return;
        setSaving(true);
        setError("");
        try {
            const res = await fetch(`/api/tasks/${task.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: title.trim(), priority, estimated_minutes: estimatedMinutes }),
            });
            if (!res.ok) {
                const data = await res.json();
                setError(data.error || "Failed to save");
                return;
            }
            router.refresh();
            onClose();
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const handleArchive = async () => {
        setSaving(true);
        setError("");
        try {
            const res = await fetch(`/api/tasks/${task.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "cancelled" }),
            });
            if (!res.ok) {
                const data = await res.json();
                setError(data.error || "Failed to archive");
                return;
            }
            router.refresh();
            onClose();
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Permanently delete this task?")) return;
        setDeleting(true);
        setError("");
        try {
            const res = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
            if (!res.ok && res.status !== 204) {
                setError("Failed to delete task");
                return;
            }
            router.refresh();
            onClose();
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="w-full max-w-md rounded-3xl border border-white/10 bg-zinc-950 shadow-2xl shadow-indigo-500/10">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
                    <h2 className="font-bold text-white">Edit Task</h2>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
                        aria-label="Close edit modal"
                        title="Close"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="space-y-5 p-6">
                    {/* Title */}
                    <div>
                        <label className="mb-2 block text-xs font-bold tracking-widest text-zinc-500 uppercase">
                            Task Title
                        </label>
                        <textarea
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            rows={2}
                            className="w-full resize-none rounded-xl border border-zinc-700 bg-zinc-900/50 px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30"
                            placeholder="What needs to be done?"
                        />
                    </div>

                    {/* Priority */}
                    <div>
                        <label className="mb-2 block text-xs font-bold tracking-widest text-zinc-500 uppercase">
                            Priority
                        </label>
                        <div className="flex gap-2">
                            {PRIORITY_OPTIONS.map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => setPriority(opt.value)}
                                    className={`flex-1 rounded-xl border py-2 text-xs font-bold transition-all ${priority === opt.value ? opt.color : "border-zinc-800 bg-zinc-900/30 text-zinc-600 hover:text-zinc-400"
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Estimated Minutes */}
                    <div>
                        <label className="mb-2 block text-xs font-bold tracking-widest text-zinc-500 uppercase">
                            Estimated Time
                        </label>
                        <div className="flex gap-2">
                            {[15, 25, 45, 60, 90].map((m) => (
                                <button
                                    key={m}
                                    onClick={() => setEstimatedMinutes(m)}
                                    className={`flex-1 rounded-xl border py-2 text-xs font-bold transition-all ${estimatedMinutes === m
                                            ? "border-indigo-500/30 bg-indigo-500/10 text-indigo-300"
                                            : "border-zinc-800 bg-zinc-900/30 text-zinc-600 hover:text-zinc-400"
                                        }`}
                                >
                                    {m}m
                                </button>
                            ))}
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-1">
                        {/* Destructive actions */}
                        <button
                            onClick={handleArchive}
                            disabled={saving || deleting}
                            className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-xs font-medium text-zinc-400 transition hover:border-zinc-600 hover:text-zinc-300 disabled:opacity-50"
                            title="Archive task (mark as cancelled)"
                        >
                            <Archive size={14} />
                            Archive
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={saving || deleting}
                            className="flex items-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs font-medium text-red-400 transition hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50"
                            title="Permanently delete task"
                        >
                            {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                            Delete
                        </button>

                        {/* Save */}
                        <button
                            onClick={handleSave}
                            disabled={saving || !title.trim()}
                            className="ml-auto flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-500 disabled:opacity-50"
                        >
                            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            Save
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
