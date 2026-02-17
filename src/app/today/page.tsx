import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect } from "next/navigation";
import TaskInput from "./TaskInput";
import FocusTimer from "./FocusTimer";
import AmbientBackground from "@/components/ui/AmbientBackground";
import TaskListClient from "./TaskListClient"; // Use a client component for interactivity

export default async function TodayPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        redirect("/api/auth/signin");
    }

    const userId = session.user.email;
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    const isoDate = new Date().toISOString().split("T")[0];

    // Ensure a default space exists for adding tasks
    let defaultSpace;
    try {
        defaultSpace = await spaceService.ensureDefaultSpace(userId);
    } catch (e) {
        console.error("Failed to ensure default space", e);
        return <div className="p-8 text-destructive">Error loading application data. Please contact support.</div>;
    }

    if (!defaultSpace?.id) {
        return <div className="p-8 text-destructive">Error: Default space has no ID.</div>;
    }

    // Fetch tasks
    const tasks = await taskService.getTasks(userId, { date: isoDate });

    // Determine active task (first non-completed that is essential/important or just first)
    const activeTask = tasks.find(t => t.status !== 'done' && t.status !== 'cancelled' && t.status !== 'migrated');

    return (
        <div className="min-h-screen relative text-foreground overflow-x-hidden">
            {/* Immersive Background */}
            <AmbientBackground />

            <div className="max-w-xl mx-auto p-6 md:p-12 pb-32 space-y-10 relative z-10">
                <header className="flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Today</h1>
                        <p className="text-muted-foreground font-medium text-lg">{today}</p>
                    </div>
                </header>

                {/* Focus Timer */}
                <section>
                    <FocusTimer
                        activeTaskId={activeTask?.id}
                        activeTaskTitle={activeTask?.title}
                    />
                </section>

                {/* Add Task Input */}
                <section>
                    <TaskInput spaceId={defaultSpace.id} />
                </section>

                {/* Tasks List - Moved to Client Component for interactivity */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Up Next ({tasks.length})</h3>
                    </div>

                    <TaskListClient tasks={tasks} />
                </section>
            </div>
        </div>
    )
}
