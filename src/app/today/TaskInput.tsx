"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Plus, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

const TaskInput = ({ spaceId }: { spaceId: string }) => {
    const [title, setTitle] = useState("");
    const [loading, setLoading] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        setLoading(true);
        try {
            const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

            const task = {
                title,
                scheduled_for: today,
                priority: "normal",
                space_id: spaceId,
            };

            const res = await fetch("/api/tasks", {
                method: "POST",
                body: JSON.stringify(task),
                headers: { "Content-Type": "application/json" }
            });

            if (!res.ok) {
                const error = await res.json();
                console.error("Failed to add task", error);
                alert("Failed code: " + res.status);
                return;
            }

            setTitle("");
            router.refresh();
        } catch (error) {
            console.error("Failed to add task", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className={cn(
                "relative rounded-2xl border transition-all duration-300",
                isFocused
                    ? "bg-white/10 border-primary/50 shadow-lg shadow-primary/10"
                    : "bg-white/5 border-white/10 hover:border-white/20"
            )}
        >
            <div className="flex items-center p-2">
                <div className="pl-3 pr-2 text-muted-foreground">
                    <Plus className="w-5 h-5" />
                </div>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder="New mission..."
                    className="flex-1 bg-transparent border-none text-white placeholder:text-muted-foreground/70 focus:ring-0 text-lg py-3"
                    disabled={loading}
                />
                <button
                    type="submit"
                    className={cn(
                        "p-3 rounded-xl transition-all duration-200",
                        title.trim()
                            ? "bg-primary text-white hover:bg-primary/90"
                            : "bg-white/5 text-muted-foreground cursor-not-allowed"
                    )}
                    disabled={loading || !title.trim()}
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowUp className="w-5 h-5" />}
                </button>
            </div>
        </form>
    );
};

export default TaskInput;
