"use client";

import { useState } from "react";
import { Project, Task, TaskStatusSchema } from "@/core/planTypes";
import { Plus, MoreHorizontal, MessageSquare, Split, CheckSquare } from "lucide-react";
import { suggestSubtasksAction, chatWithProjectAction } from "@/app/projects/actions";
// I'll create a local actions file for Kanban specific logic or generic task actions
import { handleTaskCreate, handleTaskMove } from "./kanbanActions";

type ColumnType = "todo" | "in_progress" | "done";

export default function KanbanBoard({ project, initialTasks }: { project: Project; initialTasks: Task[] }) {
    const [tasks, setTasks] = useState<Task[]>(initialTasks);
    const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
    const [isBreakingDown, setIsBreakingDown] = useState<string | null>(null);

    const columns: { id: ColumnType; title: string }[] = [
        { id: "todo", title: "To Do" },
        { id: "in_progress", title: "In Progress" },
        { id: "done", title: "Done" },
    ];

    const onDragStart = (e: React.DragEvent, taskId: string) => {
        setDraggedTaskId(taskId);
        e.dataTransfer.effectAllowed = "move";
        // e.dataTransfer.setData("text/plain", taskId); // Not strictly needed if using state but good for Firefox
    };

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault(); // Necessary to allow dropping
    };

    const onDrop = async (e: React.DragEvent, status: ColumnType) => {
        e.preventDefault();
        if (!draggedTaskId) return;

        const taskToMove = tasks.find(t => t.id === draggedTaskId);
        if (!taskToMove || taskToMove.status === status) {
            setDraggedTaskId(null);
            return;
        }

        // Optimistic Update
        const updatedTasks = tasks.map(t =>
            t.id === draggedTaskId ? { ...t, status: status } : t
        );
        setTasks(updatedTasks as Task[]);
        setDraggedTaskId(null);

        try {
            await handleTaskMove(draggedTaskId, status);
        } catch (error) {
            console.error("Failed to move task", error);
            setTasks(tasks); // Revert
            alert("Failed to update task status.");
        }
    };

    const handleBreakDown = async (task: Task) => {
        if (isBreakingDown) return;
        setIsBreakingDown(task.id!);
        try {
            const subtasks = await suggestSubtasksAction(task.title);
            for (const step of subtasks) {
                await handleTaskCreate(project.id!, step, "todo", project.space_id);
            }
            alert(`Created ${subtasks.length} subtasks for "${task.title}"`);
            window.location.reload();
        } catch (e) {
            console.error(e);
            alert("Failed to break down task.");
        } finally {
            setIsBreakingDown(null);
        }
    };

    const onTaskCreate = async (e: React.FormEvent, status: ColumnType) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const input = form.elements.namedItem("title") as HTMLInputElement;
        const title = input.value.trim();
        if (!title) return;

        const tempId = "temp-" + Date.now();
        const optimisticTask: any = {
            id: tempId,
            title,
            status,
            project_id: project.id,
            created_at: new Date(),
            priority: "normal",
            micro_steps: []
        };

        setTasks([...tasks, optimisticTask]); // Optimistic
        form.reset();

        try {
            const newTask = await handleTaskCreate(project.id!, title, status, project.space_id);
            setTasks(prev => prev.map(t => t.id === tempId ? newTask : t));
        } catch (error) {
            console.error("Failed to create task", error);
            setTasks(tasks); // Revert
        }
    };

    return (
        <div className="h-full overflow-x-auto overflow-y-hidden whitespace-nowrap p-4">
            <div className="flex h-full gap-4">
                {columns.map(col => (
                    <div
                        key={col.id}
                        className="w-80 min-w-[320px] flex flex-col bg-gray-100/50 rounded-xl border border-gray-200/60 max-h-full"
                        onDragOver={onDragOver}
                        onDrop={(e) => onDrop(e, col.id)}
                    >
                        {/* Column Header */}
                        <div className="p-3 font-semibold text-gray-700 flex justify-between items-center sticky top-0 bg-transparent z-10">
                            <span className="flex items-center gap-2">
                                {col.title}
                                <span className="bg-gray-200 text-gray-600 text-[10px] px-2 py-0.5 rounded-full">
                                    {tasks.filter(t => t.status === col.id).length}
                                </span>
                            </span>
                            <MoreHorizontal className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600" />
                        </div>

                        {/* Task List */}
                        <div className="flex-1 overflow-y-auto p-2 space-y-2">
                            {tasks.filter(t => t.status === col.id).map(task => (
                                <div
                                    key={task.id}
                                    draggable
                                    onDragStart={(e) => onDragStart(e, task.id!)}
                                    className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm cursor-grab active:cursor-grabbing hover:border-blue-300 hover:shadow-md transition-all group whitespace-normal"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="text-sm font-medium text-gray-800 leading-snug">{task.title}</p>
                                        <button
                                            onClick={() => handleBreakDown(task)}
                                            disabled={!!isBreakingDown}
                                            className="text-gray-400 hover:text-indigo-600 transition-colors p-1"
                                            title="Break down with AI"
                                            aria-label="Break down task with AI"
                                        >
                                            {isBreakingDown === task.id ? <div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /> : <Split size={12} />}
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between mt-2">
                                        <div className="flex gap-2">
                                            {task.priority === 'must_do' && (
                                                <span className="w-2 h-2 rounded-full bg-red-400" title="Must Do"></span>
                                            )}
                                        </div>
                                        <span className="text-[10px] text-gray-400">{task.estimated_minutes}m</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Quick Add */}
                        <div className="p-2 mt-auto">
                            <form onSubmit={(e) => onTaskCreate(e, col.id)} className="relative">
                                <input
                                    name="title"
                                    placeholder="Add task..."
                                    className="w-full text-sm border border-transparent bg-white shadow-sm rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-400"
                                    autoComplete="off"
                                />
                                <button type="submit" className="absolute right-2 top-2 text-gray-400 hover:text-blue-600" aria-label="Add task">
                                    <Plus className="w-4 h-4" />
                                </button>
                            </form>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
