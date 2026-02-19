"use client";

import { useState } from "react";
import { createProjectAction } from "./actions";
import { Plus, X } from "lucide-react";

export default function NewProjectForm({ spaceId }: { spaceId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setIsPending(true);
    try {
      await createProjectAction(formData);
      setIsOpen(false);
    } catch (e) {
      console.error(e);
      alert("Failed to create project");
    } finally {
      setIsPending(false);
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex h-full min-h-[160px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-700 p-6 text-zinc-500 transition-colors hover:border-indigo-500/50 hover:text-indigo-400"
      >
        <Plus className="mb-2 h-8 w-8" />
        <span className="font-medium">Create New Project</span>
      </button>
    );
  }

  return (
    <div className="glass-card rounded-xl p-5 ring-2 ring-indigo-500/20">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-foreground">New Project</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-zinc-500 hover:text-zinc-300"
          aria-label="Close form"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <form action={handleSubmit} className="space-y-4">
        <input type="hidden" name="spaceId" value={spaceId} />
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Title</label>
          <input
            name="title"
            required
            placeholder="e.g. Website Redesign"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-zinc-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            autoFocus
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Description</label>
          <textarea
            name="description"
            rows={2}
            placeholder="Brief goal..."
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-zinc-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {isPending ? "Creating..." : "Create Project"}
          </button>
        </div>
      </form>
    </div>
  );
}
