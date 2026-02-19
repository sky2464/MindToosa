"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Tag, Plus, Trash2, Pencil, Check, X } from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import { TaskLabel } from "@/core/planTypes";

const PRESET_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
  "#f97316", "#eab308", "#22c55e", "#14b8a6",
  "#3b82f6", "#64748b",
];

interface LabelsClientProps {
  initialLabels: TaskLabel[];
}

export default function LabelsClient({ initialLabels }: LabelsClientProps) {
  const router = useRouter();
  const [labels, setLabels] = useState(initialLabels);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const label = await apiClient.post<TaskLabel>("/api/labels", {
        name: newName.trim(),
        color: newColor,
      });
      setLabels((prev) => [...prev, label]);
      setNewName("");
      setNewColor(PRESET_COLORS[0]);
      router.refresh();
    } catch {
      // ignore
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (label: TaskLabel) => {
    setEditingId(label.id!);
    setEditName(label.name);
    setEditColor(label.color);
  };

  const handleUpdate = async (id: string) => {
    try {
      const updated = await apiClient.patch<TaskLabel>(`/api/labels/${id}`, {
        name: editName.trim(),
        color: editColor,
      });
      setLabels((prev) => prev.map((l) => (l.id === id ? updated : l)));
      setEditingId(null);
      router.refresh();
    } catch {
      // ignore
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this label? It will be removed from all tasks.")) return;
    try {
      await apiClient.delete(`/api/labels/${id}`);
      setLabels((prev) => prev.filter((l) => l.id !== id));
      router.refresh();
    } catch {
      // ignore
    }
  };

  return (
    <div className="container mx-auto max-w-2xl space-y-8 py-8 px-4">
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-indigo-500/10 p-2">
          <Tag className="h-5 w-5 text-indigo-400" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Labels</h1>
        <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-muted-foreground">
          {labels.length}
        </span>
      </div>

      {/* Create form */}
      <form
        onSubmit={handleCreate}
        className="glass-card rounded-2xl p-5 space-y-4"
      >
        <p className="text-sm font-semibold text-foreground">New Label</p>
        <div className="flex gap-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Label name…"
            className="flex-1 rounded-xl border border-zinc-700 bg-zinc-900/50 px-4 py-2 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-indigo-500/50"
          />
          <button
            type="submit"
            disabled={!newName.trim() || creating}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
          >
            <Plus size={14} />
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setNewColor(color)}
              className={`h-6 w-6 rounded-full transition-transform hover:scale-110 ${
                newColor === color ? "ring-2 ring-white/50 scale-110" : ""
              }`}
              style={{ backgroundColor: color }}
              aria-label={`Select color ${color}`}
            />
          ))}
        </div>
      </form>

      {/* Label list */}
      <div className="space-y-2">
        {labels.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">
            No labels yet. Create one above.
          </p>
        )}
        {labels.map((label) => (
          <div
            key={label.id}
            className="glass-card flex items-center gap-3 rounded-xl px-4 py-3"
          >
            <span
              className="h-3 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: label.color }}
            />

            {editingId === label.id ? (
              <>
                <input
                  autoFocus
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1 text-sm text-white outline-none focus:border-indigo-500/50"
                />
                <div className="flex gap-1">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setEditColor(color)}
                      className={`h-4 w-4 rounded-full transition-transform hover:scale-110 ${
                        editColor === color ? "ring-1 ring-white/50 scale-110" : ""
                      }`}
                      style={{ backgroundColor: color }}
                      aria-label={`Select color ${color}`}
                    />
                  ))}
                </div>
                <button
                  onClick={() => handleUpdate(label.id!)}
                  className="text-green-400 hover:text-green-300 transition-colors"
                  aria-label="Save label"
                >
                  <Check size={16} />
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="text-zinc-500 hover:text-zinc-300 transition-colors"
                  aria-label="Cancel edit"
                >
                  <X size={16} />
                </button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm font-medium text-foreground">{label.name}</span>
                <button
                  onClick={() => startEdit(label)}
                  className="text-zinc-500 hover:text-zinc-300 transition-colors"
                  aria-label={`Edit label ${label.name}`}
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleDelete(label.id!)}
                  className="text-zinc-500 hover:text-red-400 transition-colors"
                  aria-label={`Delete label ${label.name}`}
                >
                  <Trash2 size={14} />
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
