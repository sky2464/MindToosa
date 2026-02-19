"use client";

import { Pencil, MoveRight } from "lucide-react";
import { Task } from "@/core/planTypes";
import { PriorityBadge } from "./PriorityBadge";
import { MicroStepsList } from "./MicroStepsList";

interface TaskCardProps {
    task: Task;
    index: number;
    onDragStart: (e: React.DragEvent, taskId: string) => void;
    onEdit: (task: Task) => void;
    isDraggable?: boolean;
}

export function TaskCard({ task, index, onDragStart, onEdit, isDraggable = true }: TaskCardProps) {
    return (
        <div
            draggable={isDraggable}
            onDragStart={(e) => onDragStart(e, task.id!)}
            className={`group relative cursor-grab rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 transition-all hover:translate-x-1 hover:border-zinc-700 hover:bg-zinc-800 active:cursor-grabbing z-[var(--z-index,calc(10-${index}))] ${index === 0 ? "scale-100 translate-y-0" :
                index === 1 ? "scale-[0.98] translate-y-1" :
                    index === 2 ? "scale-[0.96] translate-y-2" :
                        "scale-[0.94] translate-y-3"
                }`}
        >
            <div className="mb-1.5 flex items-start justify-between gap-2">
                <PriorityBadge priority={task.priority} />
                <button
                    onClick={(e) => { e.stopPropagation(); onEdit(task); }}
                    className="rounded-lg p-1 text-zinc-700 opacity-0 transition-all group-hover:opacity-100 hover:bg-zinc-700 hover:text-zinc-300"
                    aria-label="Edit task"
                    title="Edit task"
                >
                    <Pencil size={12} />
                </button>
            </div>
            <h4 className="line-clamp-2 text-sm font-medium text-zinc-300 transition-colors group-hover:text-white">
                {task.title}
            </h4>
            <div className="mt-3 flex items-center justify-between">
                <span className="font-mono text-xs text-zinc-500">{task.estimated_minutes}m</span>
                <div className="opacity-0 transition-opacity group-hover:opacity-100">
                    <MoveRight size={14} className="text-zinc-600" />
                </div>
            </div>
            <MicroStepsList steps={task.micro_steps ?? []} />
        </div>
    );
}
