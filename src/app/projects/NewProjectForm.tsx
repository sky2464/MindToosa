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
                className="flex flex-col items-center justify-center h-full min-h-[160px] border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-blue-500 hover:text-blue-500 transition-colors p-6"
            >
                <Plus className="w-8 h-8 mb-2" />
                <span className="font-medium">Create New Project</span>
            </button>
        );
    }

    return (
        <div className="bg-white border border-blue-100 ring-2 ring-blue-500/20 rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-900">New Project</h3>
                <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600" aria-label="Close form">
                    <X className="w-4 h-4" />
                </button>
            </div>
            <form action={handleSubmit} className="space-y-4">
                <input type="hidden" name="spaceId" value={spaceId} />
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
                    <input
                        name="title"
                        required
                        placeholder="e.g. Website Redesign"
                        className="w-full text-sm border-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        autoFocus
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                        name="description"
                        rows={2}
                        placeholder="Brief goal..."
                        className="w-full text-sm border-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                    <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isPending}
                        className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
                    >
                        {isPending ? "Creating..." : "Create Project"}
                    </button>
                </div>
            </form>
        </div>
    );
}
