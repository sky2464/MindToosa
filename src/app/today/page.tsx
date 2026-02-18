import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { taskService } from "@/server/services/taskService";
import { spaceService } from "@/server/services/spaceService";
import TaskInput from "./TaskInput";
import FocusTimer from "./FocusTimer";
import FlowBoard from "@/components/FlowBoard";
import QuestDisplay from "@/components/QuestDisplay";
import AmbientControls from "@/components/AmbientControls";
import PlanGenerator from "./PlanGenerator";

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
    return (
      <div className="p-4 text-red-500">
        Error loading application data. Please contact support.
      </div>
    );
  }

  if (!defaultSpace?.id) {
    return <div className="p-4 text-red-500">Error: Default space has no ID.</div>;
  }

  // Fetch tasks
  const tasks = await taskService.getTasks(userId, { date: today });

  // Determine active task (first non-completed task)
  const activeTask = tasks.find(
    (t) => t.status !== "done" && t.status !== "cancelled" && t.status !== "migrated"
  );

  return (
    <div className="relative min-h-screen overflow-x-hidden p-6 pb-24 md:ml-20">
      {/* Minimal Header */}
      <header className="mb-8 flex items-center justify-between px-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Today&apos;s Flow</h1>
          <p className="mt-1 font-mono text-sm text-zinc-500">{today}</p>
        </div>
        <div className="flex items-center gap-3">
          <PlanGenerator spaceId={defaultSpace.id} />
          <AmbientControls />
        </div>
      </header>

      {/* Quest / Gamification Display */}
      <div className="mb-8">
        <QuestDisplay />
      </div>

      {/* Main Flow Board */}
      <main className="h-[calc(100vh-250px)] min-h-[600px]">
        <FlowBoard tasks={tasks} activeTaskId={activeTask?.id} />
      </main>

      {/* Floating Input (Bottom Fixed) */}
      <div className="fixed bottom-20 left-1/2 z-40 w-full max-w-xl -translate-x-1/2 px-4 md:bottom-6">
        <div className="rounded-2xl border border-white/10 bg-zinc-900/90 p-2 shadow-2xl shadow-indigo-500/10 backdrop-blur-xl">
          <TaskInput spaceId={defaultSpace.id} />
        </div>
      </div>
    </div>
  );
}
