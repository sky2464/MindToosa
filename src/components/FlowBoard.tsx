"use client";

import { useState } from "react";
import { Task } from "@/core/planTypes";
import { useRouter } from "next/navigation";

interface FlowBoardProps {
    tasks: Task[];
    activeTaskId?: string;
}

export default function FlowBoard({ tasks: initialTasks }: FlowBoardProps) {
    const [tasks, setTasks] = useState(initialTasks);
    const router = useRouter();
    const [dragTaskId, setDragTaskId] = useState<string | null>(null);

    const doneTasks = tasks.filter(t => t.status === 'done');
    const pendingTasks = tasks.filter(t => t.status !== 'done' && t.status !== 'cancelled' && t.status !== 'migrated');

    // Logic: First pending task is "In Focus"
    const activeTask = pendingTasks.length > 0 ? pendingTasks[0] : null;
    const upNextTasks = pendingTasks.length > 1 ? pendingTasks.slice(1) : [];

    const handleDragStart = (e: React.DragEvent, taskId: string) => {
        setDragTaskId(taskId);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDrop = async (e: React.DragEvent, targetStatus: 'in_focus' | 'done') => {
        e.preventDefault();
        if (!dragTaskId) return;

        // Optimistic Update
        const updatedTasks = [...tasks];
        const taskIndex = updatedTasks.findIndex(t => t.id === dragTaskId);
        if (taskIndex === -1) return;

        const task = updatedTasks[taskIndex];
        let newStatus = task.status;
        let shouldReorder = false;

        if (targetStatus === 'done') {
            newStatus = 'done';
            updatedTasks[taskIndex] = { ...task, status: 'done' };
        } else if (targetStatus === 'in_focus') {
            // Moving to focus means making it the FIRST pending task
            // We just reorder the array locally to put it at top of pending
            updatedTasks.splice(taskIndex, 1);
            // Find index of first pending to insert before
            const firstPendingIndex = updatedTasks.findIndex(t => t.status !== 'done' && t.status !== 'cancelled');
            if (firstPendingIndex !== -1) {
                updatedTasks.splice(firstPendingIndex, 0, task);
            } else {
                updatedTasks.push(task); // No pending, just add
            }
            shouldReorder = true;
        }

        setTasks(updatedTasks);
        setDragTaskId(null);

        // API Call
        try {
            if (targetStatus === 'done') {
                await fetch(`/api/tasks/${dragTaskId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'done' })
                });
            }
            // For reordering, we'd need a more complex backend sync (e.g. priority/rank).
            // For MVP prototype, we just rely on visual state and maybe simple status update if needed.
            router.refresh();
        } catch (error) {
            console.error("Failed to update task", error);
            // Revert on error would go here
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full items-start">

            {/* Up Next Column */}
            <div
                className={`transition-all duration-500 rounded-xl p-4 border border-dashed border-gray-200 min-h-[300px]
                    ${activeTask ? 'opacity-40 hover:opacity-100 grayscale hover:grayscale-0' : 'opacity-100'} 
                `}
            >
                <h3 className="text-xs font-bold uppercase text-gray-400 mb-4 tracking-wider">Up Next</h3>
                <div className="space-y-3">
                    {upNextTasks.map(task => (
                        <div
                            key={task.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, task.id!)}
                            className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 cursor-move hover:shadow-md transition active:cursor-grabbing"
                        >
                            <p className="font-medium text-gray-700 text-sm">{task.title}</p>
                            <span className="text-xs text-gray-400 mt-1 block">{task.estimated_minutes}m</span>
                        </div>
                    ))}
                    {upNextTasks.length === 0 && (
                        <div className="text-center text-gray-300 text-sm py-10 italic">
                            Empty
                        </div>
                    )}
                </div>
            </div>

            {/* In Focus Column (Drop Zone) */}
            <div
                onDrop={(e) => handleDrop(e, 'in_focus')}
                onDragOver={handleDragOver}
                className="relative z-10 md:-mt-4"
            >
                {/* Visual decoration */}
                <div className="absolute inset-0 bg-indigo-500 blur-[60px] opacity-10 rounded-full pointer-events-none"></div>

                <div className={`bg-white p-1 rounded-2xl shadow-xl border-t-4 ${activeTask ? 'border-indigo-500' : 'border-gray-200'} transition-all duration-300`}>
                    <div className="bg-indigo-50/50 p-6 rounded-xl text-center min-h-[350px] flex flex-col items-center justify-center border border-indigo-100 border-dashed relative">

                        <h3 className="absolute top-4 text-xs font-bold uppercase text-indigo-400 flex items-center gap-2">
                            {activeTask && <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />}
                            Current Focus
                        </h3>

                        {activeTask ? (
                            <div
                                draggable
                                onDragStart={(e) => handleDragStart(e, activeTask.id!)}
                                className="w-full cursor-move"
                            >
                                <h2 className="text-2xl font-bold text-gray-800 mb-2 leading-tight">{activeTask.title}</h2>
                                <div className="flex gap-2 text-sm text-gray-500 mb-8 justify-center">
                                    <span className="bg-white px-2 py-1 rounded border border-gray-200">{activeTask.estimated_minutes} min</span>
                                    <span className="bg-white px-2 py-1 rounded border border-gray-200 capitalize">{activeTask.priority.replace('_', ' ')}</span>
                                </div>
                                <div className="text-xs text-indigo-300 uppercase tracking-widest font-semibold">Drop here to Focus</div>
                            </div>
                        ) : (
                            <div className="text-gray-400 italic">
                                <p className="mb-2">No active task</p>
                                <p className="text-xs opacity-70">Drag a task here to start</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Done Column (Drop Zone) */}
            <div
                onDrop={(e) => handleDrop(e, 'done')}
                onDragOver={handleDragOver}
                className="bg-green-50/50 p-4 rounded-xl border border-green-100 min-h-[300px] border-dashed transition hover:bg-green-50"
            >
                <h3 className="text-xs font-bold uppercase text-green-600 mb-4 tracking-wider">Done</h3>
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                    {doneTasks.map(task => (
                        <div key={task.id} className="bg-white/80 p-3 rounded border border-green-100 opacity-60 hover:opacity-100 transition flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-[10px] font-bold">✓</div>
                            <p className="font-medium text-gray-500 text-sm line-through decoration-green-300">{task.title}</p>
                        </div>
                    ))}
                    {doneTasks.length === 0 && (
                        <div className="text-center text-gray-300 text-xs py-10">
                            Drop tasks here to complete
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
