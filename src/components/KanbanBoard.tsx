"use client";

import { useState } from "react";
import { Project, Task, TaskStatusSchema } from "@/core/planTypes";
import { Plus, MoreHorizontal, MessageSquare, Split, CheckSquare } from "lucide-react";
import { suggestSubtasksAction, chatWithProjectAction } from "@/app/projects/actions";
// I'll create a local actions file for Kanban specific logic or generic task actions
import { handleTaskCreate, handleTaskMove } from "./kanbanActions";

type ColumnType = "todo" | "in_progress" | "done";

export default function KanbanBoard({
  project,
  initialTasks,
}: {
  project: Project;
  initialTasks: Task[];
}) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [isBreakingDown, setIsBreakingDown] = useState<string | null>(null);

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
      alert("Failed to update task status.");
    }
  };

  const handleBreakDown = async (task: Task) => {
    if (isBreakingDown) return;
    setIsBreakingDown(task.id!);
    try {
      const subtasks = await suggestSubtasksAction(task.title);
      for (const step of subtasks) {
        await handleTaskCreate(project.id!, step, "todo", project.space_id);
      }
      alert(`Created ${subtasks.length} subtasks for "${task.title}"`);
      window.location.reload();
    } catch (e) {
      console.error(e);
      alert("Failed to break down task.");
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
    const optimisticTask: any = {
      id: tempId,
      title,
      status,
      project_id: project.id,
      created_at: new Date(),
      priority: "normal",
      micro_steps: [],
    };

    setTasks([...tasks, optimisticTask]); // Optimistic
    form.reset();

    try {
      const newTask = await handleTaskCreate(project.id!, title, status, project.space_id);
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
            className="flex max-h-full w-80 min-w-[320px] flex-col rounded-xl border border-gray-200/60 bg-gray-100/50"
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, col.id)}
          >
            {/* Column Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between bg-transparent p-3 font-semibold text-gray-700">
              <span className="flex items-center gap-2">
                {col.title}
                <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] text-gray-600">
                  {tasks.filter((t) => t.status === col.id).length}
                </span>
              </span>
              <MoreHorizontal className="h-4 w-4 cursor-pointer text-gray-400 hover:text-gray-600" />
            </div>

            {/* Task List */}
            <div className="flex-1 space-y-2 overflow-y-auto p-2">
              {tasks
                .filter((t) => t.status === col.id)
                .map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => onDragStart(e, task.id!)}
                    className="group cursor-grab rounded-lg border border-gray-200 bg-white p-3 whitespace-normal shadow-sm transition-all hover:border-blue-300 hover:shadow-md active:cursor-grabbing"
                  >
                    <div className="mb-2 flex items-start justify-between">
                      <p className="text-sm leading-snug font-medium text-gray-800">{task.title}</p>
                      <button
                        onClick={() => handleBreakDown(task)}
                        disabled={!!isBreakingDown}
                        className="p-1 text-gray-400 transition-colors hover:text-indigo-600"
                        title="Break down with AI"
                        aria-label="Break down task with AI"
                      >
                        {isBreakingDown === task.id ? (
                          <div className="h-3 w-3 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
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
                      <span className="text-[10px] text-gray-400">{task.estimated_minutes}m</span>
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
                  className="w-full rounded-lg border border-transparent bg-white px-3 py-2 text-sm shadow-sm transition-all placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  autoComplete="off"
                />
                <button
                  type="submit"
                  className="absolute top-2 right-2 text-gray-400 hover:text-blue-600"
                  aria-label="Add task"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
