import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { taskService } from "@/server/services/taskService";
import { spaceService } from "@/server/services/spaceService";
import TaskInput from "./TaskInput";
import FocusTimer from "./FocusTimer";
import FlowBoard from "@/components/FlowBoard";
import QuestDisplay from "@/components/QuestDisplay";

export default async function TodayPage() {
    const session = await auth();
    if (!session?.user?.email) {
        redirect("/api/auth/signin");
    }

    const userId = session.user.email;
    const today = new Date().toISOString().split("T")[0];

    // Ensure a default space exists for adding tasks
    let defaultSpace;
    try {
        defaultSpace = await spaceService.ensureDefaultSpace(userId);
    } catch (e) {
        console.error("Failed to ensure default space", e);
        return <div className="p-4 text-red-500">Error loading application data. Please contact support.</div>;
    }

    if (!defaultSpace?.id) {
        return <div className="p-4 text-red-500">Error: Default space has no ID.</div>;
    }

    // Fetch tasks
    const tasks = await taskService.getTasks(userId, { date: today });

    // Determine active task (first non-completed task)
    const activeTask = tasks.find(t => t.status !== 'done' && t.status !== 'cancelled' && t.status !== 'migrated');

    return (
        <div className="max-w-4xl mx-auto p-4 space-y-6 pb-20">
            <header className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Today's Flow</h1>
                    <div className="text-sm text-gray-500">{today}</div>
                </div>
                {/* Future: Add Toggle for List/Flow View if requested */}
            </header>

            {/* Gamification Stats */}
            <QuestDisplay />

            {/* Focus Timer (Top for easy access) */}
            <div className="max-w-md mx-auto">
                <FocusTimer
                    activeTaskId={activeTask?.id}
                    activeTaskTitle={activeTask?.title}
                />
            </div>

            {/* Visual Flow Board */}
            <div className="h-[500px]">
                <FlowBoard tasks={tasks} activeTaskId={activeTask?.id} />
            </div>

            {/* Quick Add */}
            <div className="max-w-md mx-auto">
                <TaskInput spaceId={defaultSpace.id} />
            </div>
        </div>
    )
}
