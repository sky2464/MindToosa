"use client";

import { CheckCircle2, Circle, Clock, Tag } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import { fireConfetti } from "@/lib/confetti";
import { useSoundEffects } from "@/hooks/useSoundEffects";

interface Task {
    id: string;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    scheduled_for: string | null;
    estimated_minutes: number | null;
    completed_at: string | null;
}

export default function TaskListClient({ tasks }: { tasks: Task[] }) {
    const { playComplete } = useSoundEffects();

    const handleTaskClick = async (task: Task) => {
        // Optimistic update could happen here, but for now we'll just emit confetti if incomplete
        if (task.status !== 'done') {
            fireConfetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
            playComplete();

            // TODO: Call API to complete task
            // Ideally we'd have a toggleTask server action or API route
            // For now, this is visual only until backend logic is wired for toggle
            try {
                await fetch(`/api/tasks/${task.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'done' })
                });
                // Recurse/Refresh handled by page reload or optimistic UI
                window.location.reload();
            } catch (e) {
                console.error("Failed to complete task", e);
            }
        }
    };

    if (tasks.length === 0) {
        return (
            <div className="text-center py-12 rounded-3xl border border-dashed border-white/10 bg-white/5">
                <p className="text-muted-foreground text-lg">No tasks for today.</p>
                <p className="text-sm text-muted-foreground/60 mt-2">Enjoy your free time!</p>
            </div>
        );
    }

    return (
        <ul className="space-y-4">
            {tasks.map(task => (
                <GlassCard
                    key={task.id}
                    className={`p-5 flex items-start gap-4 group cursor-pointer ${task.status === 'done' ? 'opacity-60' : ''}`}
                    onClick={() => handleTaskClick(task)}
                    whileHover={{ scale: 1.02 }}
                >
                    <div className="mt-1 text-muted-foreground group-hover:text-primary transition-colors">
                        {task.status === 'done' ? (
                            <CheckCircle2 className="w-6 h-6 text-green-500" />
                        ) : (
                            <Circle className="w-6 h-6" />
                        )}
                    </div>
                    <div className="flex-1">
                        <p className={`text-lg font-medium leading-tight ${task.status === 'done' ? 'line-through text-muted-foreground' : 'text-white'}`}>
                            {task.title}
                        </p>
                        <div className="flex gap-4 text-xs text-muted-foreground mt-3 font-medium">
                            {task.estimated_minutes && (
                                <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    <span>{task.estimated_minutes}m</span>
                                </div>
                            )}
                            <div className="flex items-center gap-1">
                                <Tag className="w-3 h-3" />
                                <span className="capitalize">{task.priority.replace('_', ' ')}</span>
                            </div>
                        </div>
                    </div>
                </GlassCard>
            ))}
        </ul>
    );
}
