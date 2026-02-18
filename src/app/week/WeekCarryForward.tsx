"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { Task } from "@/core/planTypes";

interface WeekCarryForwardProps {
    tasks: Task[];
    targetDate: string;
    spaceId: string;
}

export default function WeekCarryForward({ tasks, targetDate, spaceId }: WeekCarryForwardProps) {
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const router = useRouter();

    const carryForward = async () => {
        setLoading(true);
        try {
            // Update each task's scheduled_for to today and status to migrated on old, new task for today
            await Promise.all(
                tasks.map((task) =>
                    fetch(`/api/tasks/${task.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ status: "migrated" }),
                    })
                )
            );

            // Create new tasks for today
            await Promise.all(
                tasks.map((task) =>
                    fetch("/api/tasks", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            title: task.title,
                            priority: task.priority,
                            estimated_minutes: task.estimated_minutes,
                            micro_steps: task.micro_steps,
                            goal_id: task.goal_id,
                            space_id: task.space_id || spaceId,
                            scheduled_for: targetDate,
                            status: "todo",
                        }),
                    })
                )
            );

            setDone(true);
            router.refresh();
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    };

    if (done) return null;

    return (
        <div className="mb-6 flex items-center justify-between rounded-2xl border border-amber-500/20 bg-amber-500/5 px-5 py-4">
            <div>
                <p className="font-semibold text-amber-300">
                    {tasks.length} unfinished task{tasks.length !== 1 ? "s" : ""} from previous days
                </p>
                <p className="text-sm text-zinc-500">Carry them forward to today?</p>
            </div>
            <button
                onClick={carryForward}
                disabled={loading}
                className="flex items-center gap-2 rounded-xl bg-amber-500/20 px-4 py-2 text-sm font-bold text-amber-300 transition hover:bg-amber-500/30 disabled:opacity-50"
            >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                Carry Forward
            </button>
        </div>
    );
}
