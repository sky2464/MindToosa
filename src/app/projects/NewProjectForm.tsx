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
        className="flex h-full min-h-[160px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 p-6 text-gray-400 transition-colors hover:border-blue-500 hover:text-blue-500"
      >
        <Plus className="mb-2 h-8 w-8" />
        <span className="font-medium">Create New Project</span>
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-blue-100 bg-white p-5 shadow-sm ring-2 ring-blue-500/20">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">New Project</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-gray-600"
          aria-label="Close form"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <form action={handleSubmit} className="space-y-4">
        <input type="hidden" name="spaceId" value={spaceId} />
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Title</label>
          <input
            name="title"
            required
            placeholder="e.g. Website Redesign"
            className="w-full rounded-lg border-gray-200 text-sm focus:border-blue-500 focus:ring-blue-500"
            autoFocus
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Description</label>
          <textarea
            name="description"
            rows={2}
            placeholder="Brief goal..."
            className="w-full rounded-lg border-gray-200 text-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isPending ? "Creating..." : "Create Project"}
          </button>
        </div>
      </form>
    </div>
  );
}
