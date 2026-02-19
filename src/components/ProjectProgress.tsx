"use client";

import { Task } from "@/core/planTypes";

interface ProjectProgressProps {
    tasks: Task[];
}

export default function ProjectProgress({ tasks }: ProjectProgressProps) {
    const total = tasks.length;
    if (total === 0) return null;

    const done = tasks.filter((t) => t.status === "done").length;
    const inProgress = tasks.filter((t) => t.status === "in_progress").length;
    const todo = tasks.filter((t) => t.status === "todo").length;
    const percent = Math.round((done / total) * 100);

    return (
        <div className="mt-3 space-y-2">
            {/* Progress bar */}
            <div className="flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-800">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-500 w-[var(--progress)]"
                        style={{ '--progress': `${percent}%` } as React.CSSProperties}
                    />
                </div>
                <span className="font-mono text-[10px] font-bold text-zinc-500">{percent}%</span>
            </div>

            {/* Status breakdown */}
            <div className="flex gap-3 text-[10px]">
                <span className="flex items-center gap-1 text-emerald-500">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {done} done
                </span>
                <span className="flex items-center gap-1 text-indigo-400">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-indigo-500" />
                    {inProgress} active
                </span>
                <span className="flex items-center gap-1 text-zinc-500">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-zinc-600" />
                    {todo} todo
                </span>
            </div>
        </div>
    );
}
