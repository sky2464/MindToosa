"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";

const TaskInput = ({ spaceId }: { spaceId: string }) => {
  const [title, setTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsLoading(true);
    try {
      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
      const task = {
        title,
        scheduled_for: today,
        priority: "normal",
        space_id: spaceId,
      };

      const res = await fetch("/api/tasks", {
        method: "POST",
        body: JSON.stringify(task),
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const error = await res.json();
        console.error("Failed to add task", error);
        alert(`Failed to add task: ${error.error || "Unknown error"} (${res.status})`);
        return;
      }

      setTitle("");
      router.refresh(); // Tells Next.js to re-fetch server components
    } catch (error: unknown) {
      console.error("Failed to add task", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      alert(`Error submitting task: ${message}`);
    } finally {
      setIsLoading(false); // Use setIsLoading
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="What needs to be done?"
        className="w-full bg-transparent px-4 py-2 text-lg text-white placeholder:text-zinc-500 focus:outline-none"
        disabled={isLoading}
        autoFocus
      />
      <button
        type="submit"
        disabled={!title.trim() || isLoading}
        className="rounded-xl bg-indigo-600 p-2 text-white transition-all hover:scale-105 hover:bg-indigo-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? (
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        ) : (
          <Plus size={20} />
        )}
      </button>
    </form>
  );
};

export default TaskInput;
