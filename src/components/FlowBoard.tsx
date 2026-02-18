"use client";

import { useState } from "react";
import { Task } from "@/core/planTypes";
import { useRouter } from "next/navigation";
import {
  Maximize2, Minimize2, CheckCircle2, Clock, MoveRight, Flame,
  ChevronDown, ChevronUp, AlertCircle, Circle
} from "lucide-react";
import FocusTimer from "@/app/today/FocusTimer";
import useSoundEffects from "@/hooks/useSoundEffects";

interface FlowBoardProps {
  tasks: Task[];
  activeTaskId?: string;
}

function PriorityBadge({ priority }: { priority: Task["priority"] }) {
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

function MicroStepsList({ steps }: { steps: string[] }) {
  const [expanded, setExpanded] = useState(false);
  if (!steps || steps.length === 0) return null;

  return (
    <div className="mt-2">
      <button
        onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
        className="flex items-center gap-1 text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors"
      >
        {expanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
        {steps.length} steps
      </button>
      {expanded && (
        <ol className="mt-1.5 space-y-1 pl-3">
          {steps.map((step, i) => (
            <li key={i} className="flex items-start gap-1.5 text-[11px] text-zinc-500">
              <span className="mt-0.5 shrink-0 font-mono text-zinc-700">{i + 1}.</span>
              {step}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export default function FlowBoard({ tasks: initialTasks }: FlowBoardProps) {
  const [tasks, setTasks] = useState(initialTasks);
  const router = useRouter();
  const [dragTaskId, setDragTaskId] = useState<string | null>(null);
  const [zenMode, setZenMode] = useState(false);
  const { playSound } = useSoundEffects();

  const doneTasks = tasks.filter((t) => t.status === "done");
  const pendingTasks = tasks.filter(
    (t) => t.status !== "done" && t.status !== "cancelled" && t.status !== "migrated"
  );

  const activeTask = pendingTasks.length > 0 ? pendingTasks[0] : null;
  const upNextTasks = pendingTasks.length > 1 ? pendingTasks.slice(1) : [];

  // Next concrete action = first micro-step of active task
  const nextAction =
    activeTask?.micro_steps && activeTask.micro_steps.length > 0
      ? activeTask.micro_steps[0]
      : null;

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDragTaskId(taskId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: "in_focus" | "done") => {
    e.preventDefault();
    if (!dragTaskId) return;
    playSound("click");

    const updatedTasks = [...tasks];
    const taskIndex = updatedTasks.findIndex((t) => t.id === dragTaskId);
    if (taskIndex === -1) return;

    const task = updatedTasks[taskIndex];

    if (targetStatus === "done") {
      updatedTasks[taskIndex] = { ...task, status: "done" };
    } else if (targetStatus === "in_focus") {
      updatedTasks.splice(taskIndex, 1);
      const firstPendingIndex = updatedTasks.findIndex(
        (t) => t.status !== "done" && t.status !== "cancelled"
      );
      if (firstPendingIndex !== -1) {
        updatedTasks.splice(firstPendingIndex, 0, task);
      } else {
        updatedTasks.push(task);
      }
    }

    setTasks(updatedTasks);
    setDragTaskId(null);

    try {
      if (targetStatus === "done") {
        await fetch(`/api/tasks/${dragTaskId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "done" }),
        });
      }
      router.refresh();
    } catch (error) {
      console.error("Failed to update task", error);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  return (
    <div className="space-y-4">
      {/* Next Concrete Action Panel */}
      {nextAction && !zenMode && (
        <div className="flex items-center gap-3 rounded-xl border border-indigo-500/20 bg-indigo-500/5 px-4 py-3">
          <div className="shrink-0 rounded-full bg-indigo-500/20 p-1.5">
            <MoveRight size={14} className="text-indigo-400" />
          </div>
          <div>
            <p className="text-[10px] font-bold tracking-widest text-indigo-500 uppercase">Next Concrete Action</p>
            <p className="text-sm font-medium text-white">{nextAction}</p>
          </div>
        </div>
      )}

      <div
        className={`relative transition-all duration-500 ease-in-out ${zenMode ? "fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-8" : "grid h-full grid-cols-1 gap-8 lg:grid-cols-12"}`}
      >
        {/* ZEN MODE TOGGLE */}
        <button
          onClick={() => setZenMode(!zenMode)}
          className={`absolute ${zenMode ? "top-8 right-8" : "-top-12 right-0"} z-50 rounded-full p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white`}
          title={zenMode ? "Exit Focus Mode" : "Enter Focus Mode"}
          aria-label={zenMode ? "Exit Focus Mode" : "Enter Focus Mode"}
        >
          {zenMode ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
        </button>

        {/* LEFT COLUMN: UP NEXT */}
        {!zenMode && (
          <div className="space-y-6 lg:col-span-3">
            <div className="flex items-center gap-2 pl-1 text-xs font-bold tracking-widest text-zinc-500 uppercase">
              <Clock size={14} /> Up Next
            </div>
            <div className="min-h-[200px] space-y-3">
              {upNextTasks.map((task, i) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id!)}
                  className="group relative cursor-grab rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 transition-all hover:translate-x-1 hover:border-zinc-700 hover:bg-zinc-800 active:cursor-grabbing"
                  style={{
                    transform: `scale(${1 - i * 0.02}) translateY(${i * 4}px)`,
                    zIndex: 10 - i,
                  }}
                >
                  <div className="mb-1.5">
                    <PriorityBadge priority={task.priority} />
                  </div>
                  <h4 className="line-clamp-2 text-sm font-medium text-zinc-300 transition-colors group-hover:text-white">
                    {task.title}
                  </h4>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="font-mono text-xs text-zinc-500">{task.estimated_minutes}m</span>
                    <div className="opacity-0 transition-opacity group-hover:opacity-100">
                      <MoveRight size={14} className="text-zinc-600" />
                    </div>
                  </div>
                  <MicroStepsList steps={task.micro_steps ?? []} />
                </div>
              ))}
              {upNextTasks.length === 0 && (
                <div className="rounded-xl border-2 border-dashed border-zinc-800 p-8 text-center">
                  <p className="text-sm text-zinc-600 italic">No tasks upcoming</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CENTER: CURRENT FOCUS */}
        <div
          className={`${zenMode ? "w-full max-w-4xl" : "lg:col-span-6"} relative`}
          onDrop={(e) => handleDrop(e, "in_focus")}
          onDragOver={handleDragOver}
        >
          <div className="mb-6 flex items-center gap-2 pl-1 text-xs font-bold tracking-widest text-indigo-400 uppercase">
            <Flame size={14} className={activeTask ? "animate-pulse" : ""} /> Current Focus
          </div>

          <div
            className={`group relative w-full ${zenMode ? "aspect-video" : "aspect-[4/3]"} glass-card rounded-3xl p-1 transition-all duration-500`}
          >
            {/* Glow Effect */}
            <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-r from-indigo-500/20 to-violet-500/20 opacity-30 blur transition duration-1000 group-hover:opacity-50"></div>

            <div className="relative flex h-full flex-col items-center justify-center rounded-[22px] border border-white/5 bg-zinc-950/80 p-8 text-center backdrop-blur-xl">
              {activeTask ? (
                <div
                  draggable
                  onDragStart={(e) => handleDragStart(e, activeTask.id!)}
                  className="flex h-full w-full cursor-grab flex-col items-center justify-center active:cursor-grabbing"
                >
                  <div className="mb-4 flex items-center gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-400">
                      In Progress
                    </span>
                    <PriorityBadge priority={activeTask.priority} />
                  </div>
                  <h2
                    className={`${zenMode ? "text-5xl" : "text-3xl"} glow-text mb-6 max-w-2xl leading-tight font-bold text-white`}
                  >
                    {activeTask.title}
                  </h2>

                  {!zenMode && activeTask.micro_steps && activeTask.micro_steps.length > 0 && (
                    <div className="mb-4 w-full max-w-sm">
                      <p className="mb-2 text-[10px] font-bold tracking-widest text-zinc-600 uppercase">Steps</p>
                      <div className="space-y-1 text-left">
                        {activeTask.micro_steps.slice(0, 3).map((step, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-zinc-500">
                            <span className="mt-0.5 font-mono text-zinc-700">{i + 1}.</span>
                            <span className={i === 0 ? "text-zinc-300 font-medium" : ""}>{step}</span>
                          </div>
                        ))}
                        {activeTask.micro_steps.length > 3 && (
                          <p className="text-[10px] text-zinc-700">+{activeTask.micro_steps.length - 3} more</p>
                        )}
                      </div>
                    </div>
                  )}

                  {zenMode && (
                    <div className="mt-8 scale-125 transform">
                      <FocusTimer activeTaskId={activeTask.id} activeTaskTitle={activeTask.title} />
                    </div>
                  )}

                  {!zenMode && (
                    <div className="mt-6 flex w-full flex-col items-center gap-4">
                      <FocusTimer activeTaskId={activeTask.id} activeTaskTitle={activeTask.title} />

                      <div className="mt-4 flex items-center gap-6 opacity-50 transition-opacity hover:opacity-100">
                        <div className="flex flex-col items-center">
                          <span className="font-mono text-xs font-bold text-zinc-400">
                            {activeTask.estimated_minutes}m est
                          </span>
                        </div>
                        <div className="h-3 w-px bg-zinc-800"></div>
                        <div className="flex flex-col items-center">
                          <span className="font-mono text-xs font-bold text-zinc-400 capitalize">
                            {activeTask.priority.replace("_", " ")}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 text-zinc-600">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900">
                    <MoveRight size={24} className="text-zinc-700" />
                  </div>
                  <p className="text-lg font-medium">Ready to flow?</p>
                  <p className="text-sm opacity-60">Drag a task here to begin</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: DONE */}
        {!zenMode && (
          <div
            className="space-y-6 lg:col-span-3"
            onDrop={(e) => handleDrop(e, "done")}
            onDragOver={handleDragOver}
          >
            <div className="flex items-center gap-2 pl-1 text-xs font-bold tracking-widest text-emerald-500 uppercase">
              <CheckCircle2 size={14} /> Completed
            </div>

            <div className="min-h-[200px] space-y-2 rounded-xl border border-dashed border-zinc-800/50 bg-zinc-900/20 p-2 transition-colors hover:border-emerald-500/30 hover:bg-zinc-900/40">
              {doneTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 rounded-lg border border-zinc-800/80 bg-zinc-900/80 p-3 text-zinc-500 transition hover:bg-zinc-900"
                >
                  <CheckCircle2 size={16} className="text-emerald-500/50" />
                  <span className="truncate text-sm line-through decoration-zinc-700">
                    {task.title}
                  </span>
                </div>
              ))}
              {doneTasks.length === 0 && (
                <div className="py-12 text-center text-xs tracking-wider text-zinc-700 uppercase">
                  Drop tasks here
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
