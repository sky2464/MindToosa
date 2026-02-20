"use client";

import { useState } from "react";
import { Sparkles, X, Loader2 } from "lucide-react";
import { generateSubTasksAction } from "../actions";
import { Task } from "@/core/planTypes";
import { handleTaskCreate } from "@/components/kanbanActions";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";

export default function GenerateProjectTasksButton({
    projectId,
    spaceId,
}: {
    projectId: string;
    spaceId: string;
}) {
    const router = useRouter();
    const { addToast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [generatedTasks, setGeneratedTasks] = useState<Partial<Task>[] | null>(null);

    const handleGenerate = async () => {
        setIsGenerating(true);
        setGeneratedTasks(null);
        setIsOpen(true);
        try {
            const tasks = await generateSubTasksAction(projectId);
            setGeneratedTasks(tasks);
        } catch (error) {
            console.error(error);
            addToast("Failed to generate tasks", "error");
            setIsOpen(false);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSave = async () => {
        if (!generatedTasks) return;
        setIsSaving(true);
        try {
            for (const t of generatedTasks) {
                if (!t.title) continue;
                await handleTaskCreate(projectId, t.title, "todo", spaceId);
            }
            addToast("Successfully created tasks", "success");
            setIsOpen(false);
            router.refresh();
        } catch (error) {
            console.error(error);
            addToast("Failed to save tasks", "error");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            <button
                onClick={handleGenerate}
                className="flex items-center gap-2 rounded-lg bg-indigo-600/10 px-3 py-1.5 text-sm font-medium text-indigo-400 transition-colors hover:bg-indigo-600/20"
            >
                <Sparkles className="h-4 w-4" />
                Break Down Project
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-lg rounded-xl border border-zinc-800 bg-background p-6 shadow-2xl">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-foreground">
                                AI Breakdown
                            </h2>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-zinc-500 hover:text-zinc-300"
                                aria-label="Close form"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {isGenerating && (
                            <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
                                <Loader2 className="mb-4 h-8 w-8 animate-spin text-indigo-500" />
                                <p>Analyzing project scope and breaking it down...</p>
                            </div>
                        )}

                        {!isGenerating && generatedTasks && (
                            <div className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    Review the generated tasks beneath. You can edit them later.
                                </p>
                                <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-2">
                                    {generatedTasks.map((task, idx) => (
                                        <div
                                            key={idx}
                                            className="rounded-lg border border-border bg-secondary/30 p-3"
                                        >
                                            <input
                                                aria-label="Task Title"
                                                className="w-full bg-transparent text-sm font-medium text-foreground outline-none focus:border-b focus:border-indigo-500"
                                                value={task.title || ""}
                                                onChange={(e) => {
                                                    const newTasks = [...generatedTasks];
                                                    newTasks[idx] = { ...task, title: e.target.value };
                                                    setGeneratedTasks(newTasks);
                                                }}
                                            />
                                            <div className="mt-1 flex items-center text-xs text-zinc-500">
                                                <span>{task.estimated_minutes} min</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="rounded-lg px-4 py-2 font-medium text-muted-foreground hover:bg-secondary"
                                        disabled={isSaving}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={isSaving || generatedTasks.length === 0}
                                        className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                                    >
                                        {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                                        Save {generatedTasks.length} Tasks
                                    </button>
                                </div>
                            </div>
                        )}

                        {!isGenerating && !generatedTasks && (
                            <div className="text-red-400 py-6 text-center">Failed to load subtasks.</div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
