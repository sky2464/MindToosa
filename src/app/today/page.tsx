import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { taskService } from "@/server/services/taskService";
import { spaceService } from "@/server/services/spaceService";
import TaskInput from "./TaskInput";
import FocusTimer from "./FocusTimer";

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

    // Group tasks if needed
    // const mustDo = tasks.filter(t => t.priority === "must_do");

    return (
        <div className="max-w-md mx-auto p-4 space-y-8 pb-20">
            <header className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Today</h1>
                <div className="text-sm text-gray-500">{today}</div>
            </header>

            {/* Focus Timer */}
            <FocusTimer />

            {/* Add Task Input */}
            <TaskInput spaceId={defaultSpace.id} />

            {/* Tasks List */}
            <section>
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-3">Tasks ({tasks.length})</h3>

                {tasks.length === 0 ? (
                    <p className="text-gray-400 text-sm italic text-center py-8">No tasks scheduled for today. Add one above!</p>
                ) : (
                    <ul className="space-y-3">
                        {tasks.map(task => (
                            <li key={task.id} className="p-4 border rounded-lg shadow-sm flex items-start gap-4 bg-white">
                                <div className={`w-5 h-5 rounded-full border-2 mt-1 flex-shrink-0 cursor-pointer ${task.status === 'done' ? 'bg-green-500 border-green-500' : 'border-gray-300'}`} />
                                <div>
                                    <p className={`font-medium ${task.status === 'done' ? 'line-through text-gray-400' : ''}`}>{task.title}</p>
                                    <div className="flex gap-2 text-sm text-gray-500 mt-1">
                                        <span>{task.estimated_minutes}m</span>
                                        <span>•</span>
                                        <span className="capitalize">{task.priority.replace('_', ' ')}</span>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    )
}
