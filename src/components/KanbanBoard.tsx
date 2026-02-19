"use client";

import { useState } from "react";
import { Project, Task } from "@/core/planTypes";
import { Plus, MoreHorizontal, Split } from "lucide-react";
import { suggestSubtasksAction } from "@/app/projects/actions";
import { handleTaskCreate, handleTaskMove } from "./kanbanActions";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import { ToastContainer } from "@/components/ui/ToastContainer";

type ColumnType = "todo" | "in_progress" | "done";

export default function KanbanBoard({
  project,
  initialTasks,
}: {
  project: Project;
  initialTasks: Task[];
}) {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [isBreakingDown, setIsBreakingDown] = useState<string | null>(null);
  const { toasts, addToast, dismissToast } = useToast();

  const columns: { id: ColumnType; title: string }[] = [
    { id: "todo", title: "To Do" },
    { id: "in_progress", title: "In Progress" },
    { id: "done", title: "Done" },
  ];

  const onDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = "move";
    // e.dataTransfer.setData("text/plain", taskId); // Not strictly needed if using state but good for Firefox
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  const onDrop = async (e: React.DragEvent, status: ColumnType) => {
    e.preventDefault();
    if (!draggedTaskId) return;

    const taskToMove = tasks.find((t) => t.id === draggedTaskId);
    if (!taskToMove || taskToMove.status === status) {
      setDraggedTaskId(null);
      return;
    }

    // Optimistic Update
    const updatedTasks = tasks.map((t) => (t.id === draggedTaskId ? { ...t, status: status } : t));
    setTasks(updatedTasks as Task[]);
    setDraggedTaskId(null);

    try {
      await handleTaskMove(draggedTaskId, status);
    } catch (error) {
      console.error("Failed to move task", error);
      setTasks(tasks); // Revert
      addToast("Failed to update task status.", "error");
    }
  };

  const handleBreakDown = async (task: Task) => {
    if (isBreakingDown || !task.id) return;
    setIsBreakingDown(task.id);
    try {
      if (!project.id) return;
      const subtasks = await suggestSubtasksAction(task.title);
      for (const step of subtasks) {
        await handleTaskCreate(project.id, step, "todo", project.space_id);
      }
      addToast(`Created ${subtasks.length} subtasks for "${task.title}"`, "success");
      router.refresh();
    } catch (e) {
      console.error(e);
      addToast("Failed to break down task.", "error");
    } finally {
      setIsBreakingDown(null);
    }
  };

  const onTaskCreate = async (e: React.FormEvent, status: ColumnType) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const input = form.elements.namedItem("title") as HTMLInputElement;
    const title = input.value.trim();
    if (!title) return;

    const tempId = "temp-" + Date.now();
    const optimisticTask: Task = {
      id: tempId,
      title,
      status,
      user_id: "",
      space_id: project.space_id,
      project_id: project.id,
      created_at: new Date(),
      priority: "normal",
      estimated_minutes: 25,
      micro_steps: [],
    };

    setTasks([...tasks, optimisticTask]); // Optimistic
    form.reset();

    try {
      if (!project.id) return;
      const newTask = await handleTaskCreate(project.id, title, status, project.space_id);
      setTasks((prev) => prev.map((t) => (t.id === tempId ? newTask : t)));
    } catch (error) {
      console.error("Failed to create task", error);
      setTasks(tasks); // Revert
    }
  };

  return (
    <div className="h-full overflow-x-auto overflow-y-hidden p-4 whitespace-nowrap">
      <div className="flex h-full gap-4">
        {columns.map((col) => (
          <div
            key={col.id}
            className="flex max-h-full w-80 min-w-[320px] flex-col rounded-xl border border-border bg-secondary/30"
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, col.id)}
          >
            {/* Column Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between bg-transparent p-3 font-semibold text-muted-foreground">
              <span className="flex items-center gap-2">
                {col.title}
                <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">
                  {tasks.filter((t) => t.status === col.id).length}
                </span>
              </span>
              <MoreHorizontal className="h-4 w-4 cursor-pointer text-zinc-600 hover:text-zinc-400" />
            </div>

            {/* Task List */}
            <div className="flex-1 space-y-2 overflow-y-auto p-2">
              {tasks
                .filter((t) => t.status === col.id)
                .map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => task.id && onDragStart(e, task.id)}
                    className="glass-card group cursor-grab rounded-lg p-3 whitespace-normal transition-all hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/5 active:cursor-grabbing"
                  >
                    <div className="mb-2 flex items-start justify-between">
                      <p className="text-sm leading-snug font-medium text-foreground">{task.title}</p>
                      <button
                        onClick={() => handleBreakDown(task)}
                        disabled={!!isBreakingDown}
                        className="p-1 text-zinc-500 transition-colors hover:text-indigo-400"
                        title="Break down with AI"
                        aria-label="Break down task with AI"
                      >
                        {isBreakingDown === task.id ? (
                          <div className="h-3 w-3 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                        ) : (
                          <Split size={12} />
                        )}
                      </button>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex gap-2">
                        {task.priority === "must_do" && (
                          <span className="h-2 w-2 rounded-full bg-red-400" title="Must Do"></span>
                        )}
                      </div>
                      <span className="text-[10px] text-zinc-500">{task.estimated_minutes}m</span>
                    </div>
                  </div>
                ))}
            </div>

            {/* Quick Add */}
            <div className="mt-auto p-2">
              <form onSubmit={(e) => onTaskCreate(e, col.id)} className="relative">
                <input
                  name="title"
                  placeholder="Add task..."
                  className="w-full rounded-lg border border-transparent bg-zinc-900 px-3 py-2 text-sm text-foreground shadow-sm transition-all placeholder:text-zinc-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                  autoComplete="off"
                />
                <button
                  type="submit"
                  className="absolute top-2 right-2 text-zinc-500 hover:text-indigo-400"
                  aria-label="Add task"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
