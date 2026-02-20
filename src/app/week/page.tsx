import { auth } from "@auth";
import { redirect } from "next/navigation";
import { taskService } from "@/server/services/taskService";
import { spaceService } from "@/server/services/spaceService";
import { Calendar, ChevronRight, RefreshCw } from "lucide-react";
import Link from "next/link";
import WeekCarryForward from "./WeekCarryForward";

function getDaysOfWeek(): string[] {
    const days: string[] = [];
    const today = new Date();
    // Start from Monday of the current week
    const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon, ...
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));

    for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        days.push(d.toISOString().split("T")[0]);
    }
    return days;
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default async function WeekPage() {
    const session = await auth();
    if (!session?.user?.email) redirect("/api/auth/signin");

    const userId = session.user.email;
    const today = new Date().toISOString().split("T")[0];
    const days = getDaysOfWeek();

    // Fetch tasks for the week range only (not all tasks)
    const defaultSpace = await spaceService.ensureDefaultSpace(userId);
    const weekTasks = await taskService.getTasks(userId, {
        dateFrom: days[0],
        dateTo: days[6],
    });

    // Also fetch past incomplete tasks for carry-forward (30-day window to avoid unbounded query)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const pastIncompleteCandidates = await taskService.getTasks(userId, {
        dateFrom: thirtyDaysAgo.toISOString().split("T")[0],
        dateTo: today,
    });
    const allTasks = [...weekTasks, ...pastIncompleteCandidates.filter(
        (t) => !weekTasks.some((wt) => wt.id === t.id)
    )];

    // Group tasks by date
    const tasksByDate: Record<string, typeof allTasks> = {};
    for (const day of days) {
        tasksByDate[day] = allTasks.filter((t) => t.scheduled_for === day);
    }

    // Find incomplete tasks from past days (carry-forward candidates)
    const pastIncompleteTasks = allTasks.filter(
        (t) =>
            t.scheduled_for &&
            t.scheduled_for < today &&
            t.status !== "done" &&
            t.status !== "cancelled" &&
            t.status !== "migrated"
    );

    return (
        <div className="min-h-screen p-4 sm:p-6 lg:p-8 pb-24 max-w-6xl mx-auto">
            <header className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="flex items-center gap-3 text-4xl font-black tracking-tight text-white">
                        <Calendar className="text-indigo-500" size={36} />
                        This Week
                    </h1>
                    <p className="mt-1 text-zinc-500">Week of {days[0]} — {days[6]}</p>
                </div>
                <Link
                    href="/today"
                    className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-sm font-medium text-zinc-400 transition hover:border-indigo-500/30 hover:text-white"
                >
                    Today <ChevronRight size={16} />
                </Link>
            </header>

            {/* Carry-forward banner */}
            {pastIncompleteTasks.length > 0 && (
                <WeekCarryForward
                    tasks={pastIncompleteTasks}
                    targetDate={today}
                    spaceId={defaultSpace.id!}
                />
            )}

            {/* 7-day grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-7">
                {days.map((day, i) => {
                    const isToday = day === today;
                    const isPast = day < today;
                    const dayTasks = tasksByDate[day] ?? [];
                    const doneTasks = dayTasks.filter((t) => t.status === "done");
                    const pendingTasks = dayTasks.filter(
                        (t) => t.status !== "done" && t.status !== "cancelled"
                    );

                    return (
                        <div
                            key={day}
                            className={`rounded-2xl border p-4 transition-all ${isToday
                                ? "border-indigo-500/40 bg-indigo-500/5 shadow-[0_0_20px_rgba(99,102,241,0.1)]"
                                : isPast
                                    ? "border-zinc-800/50 bg-zinc-900/20 opacity-70"
                                    : "border-zinc-800 bg-zinc-900/30"
                                }`}
                        >
                            <div className="mb-3 flex items-center justify-between">
                                <span
                                    className={`text-xs font-bold tracking-widest uppercase ${isToday ? "text-indigo-400" : "text-zinc-500"
                                        }`}
                                >
                                    {DAY_LABELS[i]}
                                </span>
                                <span
                                    className={`font-mono text-xs ${isToday ? "text-indigo-300" : "text-zinc-600"
                                        }`}
                                >
                                    {day.slice(5)} {/* MM-DD */}
                                </span>
                            </div>

                            {dayTasks.length === 0 ? (
                                <p className="text-xs text-zinc-700 italic">No tasks</p>
                            ) : (
                                <div className="space-y-1.5">
                                    {pendingTasks.map((task) => (
                                        <div
                                            key={task.id}
                                            className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-2.5 py-1.5"
                                        >
                                            <p className="line-clamp-2 text-xs text-zinc-300">{task.title}</p>
                                            <div className="mt-1 flex flex-wrap items-center gap-1">
                                                {task.priority === "must_do" && (
                                                    <span className="inline-block rounded-full bg-red-500/10 px-1.5 py-0.5 text-[9px] font-bold text-red-400 uppercase">
                                                        Must-do
                                                    </span>
                                                )}
                                                {task.series_id && (
                                                    <span className="inline-flex items-center gap-0.5 rounded-full bg-indigo-500/10 px-1.5 py-0.5 text-[9px] text-indigo-400" title="Recurring task">
                                                        <RefreshCw size={8} />
                                                        Recurring
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {doneTasks.length > 0 && (
                                        <p className="text-[10px] text-emerald-600">
                                            ✓ {doneTasks.length} done
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
