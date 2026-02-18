"use client";

import { AlertCircle, Circle } from "lucide-react";
import { Task } from "@/core/planTypes";

interface PriorityBadgeProps {
    priority: Task["priority"];
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
    if (priority === "must_do") {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-400 uppercase tracking-wider">
                <AlertCircle size={10} /> Must-do
            </span>
        );
    }
    if (priority === "optional") {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                <Circle size={10} /> Optional
            </span>
        );
    }
    return null;
}
