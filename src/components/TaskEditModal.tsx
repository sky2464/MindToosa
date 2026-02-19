"use client";

import { useState, useEffect, useCallback } from "react";
import { Task } from "@/core/planTypes";
import { useRouter } from "next/navigation";
import {
    X, Trash2, Archive, Save, Loader2, AlertCircle,
    MessageSquare, ListTree, Tag, Plus, Send, ChevronDown, ChevronRight, Sparkles, Link2, XCircle
} from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { suggestSubtasksAction } from "@/app/projects/actions";

interface TaskEditModalProps {
    task: Task;
    onClose: () => void;
}

interface Comment {
    id: string;
    content: string;
    user_id: string;
    created_at: string;
}

interface Label {
    id: string;
    name: string;
    color: string;
}

type TabId = "details" | "subtasks" | "comments" | "labels" | "dependencies";

const PRIORITY_OPTIONS: { value: Task["priority"]; label: string; color: string }[] = [
    { value: "must_do", label: "Must-do", color: "text-red-400 border-red-500/30 bg-red-500/10" },
    { value: "optional", label: "Optional", color: "text-amber-400 border-amber-500/30 bg-amber-500/10" },
    { value: "normal", label: "Normal", color: "text-zinc-400 border-zinc-700 bg-zinc-800/50" },
];

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "details", label: "Details", icon: null },
    { id: "subtasks", label: "Subtasks", icon: <ListTree size={14} /> },
    { id: "comments", label: "Comments", icon: <MessageSquare size={14} /> },
    { id: "labels", label: "Labels", icon: <Tag size={14} /> },
    { id: "dependencies", label: "Blocks", icon: <Link2 size={14} /> },
];

export default function TaskEditModal({ task, onClose }: TaskEditModalProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabId>("details");

    // Details state
    const [title, setTitle] = useState(task.title);
    const [priority, setPriority] = useState<Task["priority"]>(task.priority ?? "normal");
    const [estimatedMinutes, setEstimatedMinutes] = useState(task.estimated_minutes ?? 25);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [error, setError] = useState("");
    const [recurrence, setRecurrence] = useState(task.recurrence_rule ?? "");

    // Subtasks state
    const [subtasks, setSubtasks] = useState<Task[]>([]);
    const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
    const [subtasksExpanded, setSubtasksExpanded] = useState(true);
    const [suggesting, setSuggesting] = useState(false);

    // Comments state
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [commentsLoading, setCommentsLoading] = useState(false);

    // Labels state
    const [userLabels, setUserLabels] = useState<Label[]>([]);
    const [taskLabelIds, setTaskLabelIds] = useState<Set<string>>(new Set());
    const [newLabelName, setNewLabelName] = useState("");
    const [newLabelColor, setNewLabelColor] = useState("#6366f1");

    // Dependencies state (tasks that block this task)
    const [dependencies, setDependencies] = useState<Task[]>([]);
    const [depSearch, setDepSearch] = useState("");
    const [depResults, setDepResults] = useState<Task[]>([]);

    // Fetch subtasks
    const fetchSubtasks = useCallback(async () => {
        if (!task.id) return;
        try {
            const data = await apiClient.get<Task[]>(`/api/tasks?parentId=${task.id}`);
            setSubtasks(data);
        } catch {
            // Subtasks endpoint may not exist yet with parentId filter, that's OK
            setSubtasks([]);
        }
    }, [task.id]);

    // Fetch comments
    const fetchComments = useCallback(async () => {
        if (!task.id) return;
        setCommentsLoading(true);
        try {
            const data = await apiClient.get<Comment[]>(`/api/tasks/${task.id}/comments`);
            setComments(data);
        } catch {
            setComments([]);
        } finally {
            setCommentsLoading(false);
        }
    }, [task.id]);

    // Fetch labels
    const fetchLabels = useCallback(async () => {
        try {
            const [allLabels, assigned] = await Promise.all([
                apiClient.get<Label[]>("/api/labels"),
                apiClient.get<Label[]>(`/api/tasks/${task.id}/labels`),
            ]);
            setUserLabels(allLabels);
            setTaskLabelIds(new Set(assigned.map((l: Label) => l.id)));
        } catch {
            // Labels API may not exist yet
        }
    }, [task.id]);

    // Fetch dependencies (tasks that block this task)
    const fetchDependencies = useCallback(async () => {
        if (!task.id) return;
        try {
            const data = await apiClient.get<Task[]>(`/api/tasks/${task.id}/dependencies`);
            setDependencies(data);
        } catch {
            setDependencies([]);
        }
    }, [task.id]);

    useEffect(() => {
        if (activeTab === "subtasks") fetchSubtasks();
        if (activeTab === "comments") fetchComments();
        if (activeTab === "labels") fetchLabels();
        if (activeTab === "dependencies") fetchDependencies();
    }, [activeTab, fetchSubtasks, fetchComments, fetchLabels, fetchDependencies]);

    const handleSave = async () => {
        if (!title.trim()) return;
        setSaving(true);
        setError("");
        try {
            await apiClient.patch(`/api/tasks/${task.id}`, {
                title: title.trim(),
                priority,
                estimated_minutes: estimatedMinutes,
                recurrence_rule: recurrence || null,
            });
            router.refresh();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save");
        } finally {
            setSaving(false);
        }
    };

    const handleArchive = async () => {
        setSaving(true);
        setError("");
        try {
            await apiClient.patch(`/api/tasks/${task.id}`, { status: "cancelled" });
            router.refresh();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to archive");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        setShowDeleteConfirm(false);
        setDeleting(true);
        setError("");
        try {
            await apiClient.delete(`/api/tasks/${task.id}`);
            router.refresh();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to delete task");
        } finally {
            setDeleting(false);
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim() || !task.id) return;
        try {
            await apiClient.post(`/api/tasks/${task.id}/comments`, { content: newComment.trim() });
            setNewComment("");
            fetchComments();
        } catch {
            setError("Failed to add comment");
        }
    };

    const handleAddSubtask = async () => {
        if (!newSubtaskTitle.trim() || !task.id) return;
        try {
            await apiClient.post("/api/tasks", {
                title: newSubtaskTitle.trim(),
                parent_task_id: task.id,
                space_id: task.space_id,
                priority: "normal",
            });
            setNewSubtaskTitle("");
            fetchSubtasks();
            router.refresh();
        } catch {
            setError("Failed to add subtask");
        }
    };

    const handleSuggestSubtasks = async () => {
        if (!task.id || suggesting) return;
        setSuggesting(true);
        setError("");
        try {
            const suggestions = await suggestSubtasksAction(task.title);
            await Promise.all(
                suggestions.map((title) =>
                    apiClient.post("/api/tasks", {
                        title,
                        parent_task_id: task.id,
                        space_id: task.space_id,
                        priority: "normal",
                    })
                )
            );
            fetchSubtasks();
            router.refresh();
        } catch {
            setError("Failed to suggest subtasks");
        } finally {
            setSuggesting(false);
        }
    };

    const handleToggleLabelOnTask = async (labelId: string) => {
        if (!task.id) return;
        const isAssigned = taskLabelIds.has(labelId);
        try {
            if (isAssigned) {
                await apiClient.delete(`/api/tasks/${task.id}/labels/${labelId}`);
                setTaskLabelIds((prev) => {
                    const next = new Set(prev);
                    next.delete(labelId);
                    return next;
                });
            } else {
                await apiClient.post(`/api/tasks/${task.id}/labels`, { label_id: labelId });
                setTaskLabelIds((prev) => new Set(prev).add(labelId));
            }
        } catch {
            // Label toggle may fail silently
        }
    };

    const handleCreateLabel = async () => {
        if (!newLabelName.trim()) return;
        try {
            const label = await apiClient.post<Label>("/api/labels", {
                name: newLabelName.trim(),
                color: newLabelColor,
            });
            setUserLabels((prev) => [...prev, label]);
            setNewLabelName("");
        } catch {
            setError("Failed to create label");
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-zinc-950 shadow-2xl shadow-indigo-500/10 max-h-[85vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/5 px-6 py-4 shrink-0">
                    <h2 className="font-bold text-white">Edit Task (Recurrence Added)</h2>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
                        aria-label="Close edit modal"
                        title="Close"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 border-b border-white/5 px-4 pt-2 shrink-0">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-1.5 rounded-t-lg px-3 py-2 text-xs font-bold transition-all ${activeTab === tab.id
                                ? "border-b-2 border-indigo-500 text-indigo-400 bg-indigo-500/5"
                                : "text-zinc-600 hover:text-zinc-400"
                                }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content (scrollable) */}
                <div className="overflow-y-auto flex-1 p-6">
                    {activeTab === "details" && (
                        <div className="space-y-5">
                            {/* Title */}
                            <div>
                                <label htmlFor="task-title-edit" className="mb-2 block text-xs font-bold tracking-widest text-zinc-500 uppercase">
                                    Task Title
                                </label>
                                <textarea
                                    id="task-title-edit"
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

                            {/* Recurrence */}
                            <div>
                                <label className="mb-2 block text-xs font-bold tracking-widest text-zinc-500 uppercase">
                                    Repeat
                                </label>
                                <select
                                    value={recurrence}
                                    title="Recurrence Rule"
                                    onChange={(e) => setRecurrence(e.target.value)}
                                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900/50 px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500/50"
                                >
                                    <option value="">Don't repeat</option>
                                    <option value="FREQ=DAILY">Daily</option>
                                    <option value="FREQ=WEEKLY">Weekly</option>
                                    <option value="FREQ=MONTHLY">Monthly</option>
                                    <option value="FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR">Weekdays (M-F)</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {activeTab === "subtasks" && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setSubtasksExpanded(!subtasksExpanded)}
                                    className="text-zinc-500 hover:text-zinc-300"
                                    aria-label="Toggle subtasks"
                                >
                                    {subtasksExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                </button>
                                <span className="text-xs font-bold tracking-widest text-zinc-500 uppercase">
                                    Subtasks ({subtasks.length})
                                </span>
                                <button
                                    onClick={handleSuggestSubtasks}
                                    disabled={suggesting}
                                    className="ml-auto flex items-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-bold text-indigo-400 transition hover:bg-indigo-500/20 disabled:opacity-50"
                                    title="AI-suggest subtasks"
                                >
                                    {suggesting ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                    AI Suggest
                                </button>
                            </div>

                            {subtasksExpanded && (
                                <>
                                    <div className="space-y-2">
                                        {subtasks.map((st) => (
                                            <div key={st.id} className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/30 px-4 py-3">
                                                <div className={`h-2 w-2 rounded-full shrink-0 ${st.status === "done" ? "bg-emerald-500" :
                                                    st.status === "in_progress" ? "bg-indigo-500" : "bg-zinc-600"
                                                    }`} />
                                                <span className={`text-sm flex-1 ${st.status === "done" ? "text-zinc-500 line-through" : "text-zinc-300"}`}>
                                                    {st.title}
                                                </span>
                                                <span className="text-[10px] text-zinc-600 uppercase">{st.status}</span>
                                            </div>
                                        ))}
                                        {subtasks.length === 0 && (
                                            <p className="text-sm text-zinc-600 italic py-4 text-center">No subtasks yet</p>
                                        )}
                                    </div>

                                    <div className="flex gap-2">
                                        <input
                                            aria-label="New subtask title"
                                            value={newSubtaskTitle}
                                            onChange={(e) => setNewSubtaskTitle(e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter" && handleAddSubtask()}
                                            className="flex-1 rounded-xl border border-zinc-700 bg-zinc-900/50 px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-indigo-500/50"
                                            placeholder="Add a subtask..."
                                        />
                                        <button
                                            onClick={handleAddSubtask}
                                            disabled={!newSubtaskTitle.trim()}
                                            className="rounded-xl bg-indigo-600 px-3 py-2 text-white transition hover:bg-indigo-500 disabled:opacity-50"
                                            aria-label="Add subtask"
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {activeTab === "comments" && (
                        <div className="space-y-4">
                            <div className="space-y-3 max-h-60 overflow-y-auto">
                                {commentsLoading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 size={20} className="animate-spin text-zinc-500" />
                                    </div>
                                ) : comments.length === 0 ? (
                                    <p className="text-sm text-zinc-600 italic py-8 text-center">No comments yet</p>
                                ) : (
                                    comments.map((c) => (
                                        <div key={c.id} className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
                                            <p className="text-sm text-zinc-300">{c.content}</p>
                                            <p className="mt-2 text-[10px] text-zinc-600">
                                                {new Date(c.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="flex gap-2">
                                <input
                                    aria-label="Write a comment"
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                                    className="flex-1 rounded-xl border border-zinc-700 bg-zinc-900/50 px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-indigo-500/50"
                                    placeholder="Write a comment..."
                                />
                                <button
                                    onClick={handleAddComment}
                                    disabled={!newComment.trim()}
                                    className="rounded-xl bg-indigo-600 px-3 py-2 text-white transition hover:bg-indigo-500 disabled:opacity-50"
                                    aria-label="Send comment"
                                >
                                    <Send size={16} />
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === "labels" && (
                        <div className="space-y-4">
                            <p className="text-xs font-bold tracking-widest text-zinc-500 uppercase">Manage Labels</p>

                            <div className="space-y-2">
                                {userLabels.map((label) => (
                                    <button
                                        key={label.id}
                                        onClick={() => handleToggleLabelOnTask(label.id)}
                                        className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-all ${taskLabelIds.has(label.id)
                                            ? "border-indigo-500/30 bg-indigo-500/10 text-white"
                                            : "border-zinc-800 bg-zinc-900/30 text-zinc-400 hover:border-zinc-700"
                                            }`}
                                    >
                                        <div
                                            className="h-3 w-3 rounded-full shrink-0"
                                            ref={(el) => { if (el) el.style.backgroundColor = label.color; }}
                                        />
                                        <span className="flex-1 text-left">{label.name}</span>
                                        {taskLabelIds.has(label.id) && (
                                            <span className="text-[10px] font-bold text-indigo-400">ASSIGNED</span>
                                        )}
                                    </button>
                                ))}
                                {userLabels.length === 0 && (
                                    <p className="text-sm text-zinc-600 italic py-4 text-center">No labels created yet</p>
                                )}
                            </div>

                            <div className="flex gap-2 items-center pt-2 border-t border-white/5">
                                <input
                                    type="color"
                                    value={newLabelColor}
                                    onChange={(e) => setNewLabelColor(e.target.value)}
                                    className="h-8 w-8 cursor-pointer rounded-lg border border-zinc-700 bg-transparent"
                                    title="Label color"
                                />
                                <input
                                    value={newLabelName}
                                    onChange={(e) => setNewLabelName(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleCreateLabel()}
                                    className="flex-1 rounded-xl border border-zinc-700 bg-zinc-900/50 px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-indigo-500/50"
                                    placeholder="New label name..."
                                />
                                <button
                                    onClick={handleCreateLabel}
                                    disabled={!newLabelName.trim()}
                                    className="rounded-xl bg-indigo-600 px-3 py-2 text-white transition hover:bg-indigo-500 disabled:opacity-50"
                                    aria-label="Create label"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === "dependencies" && (
                        <div className="space-y-4">
                            <p className="text-xs font-bold tracking-widest text-zinc-500 uppercase">Blocked By</p>
                            <p className="text-xs text-zinc-600">Tasks listed here must be completed before this task.</p>

                            {/* Current dependencies */}
                            <div className="space-y-2">
                                {dependencies.length === 0 && (
                                    <p className="text-sm text-zinc-600 italic py-2">No blocking tasks.</p>
                                )}
                                {dependencies.map((dep) => (
                                    <div key={dep.id} className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/30 px-4 py-2.5">
                                        <span className="flex-1 text-sm text-zinc-300 truncate">{dep.title}</span>
                                        <button
                                            onClick={async () => {
                                                try {
                                                    await apiClient.delete(`/api/tasks/${task.id}/dependencies`, { blocking_task_id: dep.id });
                                                    setDependencies((prev) => prev.filter((d) => d.id !== dep.id));
                                                } catch { /* ignore */ }
                                            }}
                                            className="text-zinc-600 hover:text-red-400 transition-colors"
                                            aria-label={`Remove dependency on ${dep.title}`}
                                        >
                                            <XCircle size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Search to add dependency */}
                            <div className="border-t border-white/5 pt-3 space-y-2">
                                <input
                                    value={depSearch}
                                    onChange={async (e) => {
                                        setDepSearch(e.target.value);
                                        if (e.target.value.trim().length < 2) { setDepResults([]); return; }
                                        try {
                                            const results = await apiClient.get<Task[]>(`/api/tasks?q=${encodeURIComponent(e.target.value)}`);
                                            setDepResults(results.filter((t) => t.id !== task.id && !dependencies.some((d) => d.id === t.id)));
                                        } catch { setDepResults([]); }
                                    }}
                                    placeholder="Search tasks to add as blocker…"
                                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900/50 px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-indigo-500/50"
                                />
                                {depResults.map((t) => (
                                    <button
                                        key={t.id}
                                        onClick={async () => {
                                            try {
                                                await apiClient.post(`/api/tasks/${task.id}/dependencies`, { blocking_task_id: t.id });
                                                setDependencies((prev) => [...prev, t]);
                                                setDepResults((prev) => prev.filter((r) => r.id !== t.id));
                                                setDepSearch("");
                                            } catch { /* ignore */ }
                                        }}
                                        className="flex w-full items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/30 px-4 py-2 text-sm text-zinc-400 hover:border-zinc-600 hover:text-white transition-all"
                                    >
                                        <Plus size={12} />
                                        {t.title}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer — always visible */}
                <div className="border-t border-white/5 px-6 py-4 shrink-0">
                    {error && (
                        <div className="mb-3 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}
                    <div className="flex items-center gap-3">
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
                            onClick={() => setShowDeleteConfirm(true)}
                            disabled={saving || deleting}
                            className="flex items-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs font-medium text-red-400 transition hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50"
                            title="Permanently delete task"
                        >
                            {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                            Delete
                        </button>

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
            <ConfirmDialog
                isOpen={showDeleteConfirm}
                title="Delete Task"
                message={`Permanently delete "${task.title}"? This cannot be undone.`}
                confirmLabel="Delete"
                variant="danger"
                onConfirm={handleDelete}
                onCancel={() => setShowDeleteConfirm(false)}
            />
        </div>
    );
}
