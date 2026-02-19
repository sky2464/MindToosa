"use client";

import { useState, useRef, useEffect } from "react";
import { Project, Task } from "@/core/planTypes";
import { chatWithProjectAction } from "@/app/projects/actions";
import { Send, Bot, User, Loader2 } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function AIChat({ project, tasks }: { project: Project; tasks: Task[] }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init",
      role: "assistant",
      content: `Hi! I'm here to help you with "${project.title}". Ask me anything about your tasks or goals.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const response = await chatWithProjectAction(project.id!, userMsg);
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "assistant", content: response }]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: "Sorry, I encountered an error. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full flex-col bg-card">
      <div className="flex-1 space-y-4 overflow-y-auto p-4" ref={scrollRef} role="log" aria-live="polite">
        {messages.map((m) => (
          <div key={m.id} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${m.role === "assistant"
                ? "bg-indigo-500/10 text-indigo-400"
                : "bg-zinc-800 text-zinc-400"
                }`}
            >
              {m.role === "assistant" ? <Bot size={16} /> : <User size={16} />}
            </div>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${m.role === "assistant"
                ? "rounded-tl-none bg-secondary text-foreground"
                : "rounded-tr-none bg-indigo-600 text-white"
                }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-400">
              <Bot size={16} />
            </div>
            <div className="rounded-2xl rounded-tl-none bg-secondary px-4 py-2">
              <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-border bg-secondary/50 p-3">
        <form onSubmit={handleSubmit} className="relative">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask AI..."
            aria-label="Chat input"
            className="w-full rounded-full border border-border bg-background py-2.5 pr-10 pl-4 text-sm text-foreground focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="absolute top-1.5 right-1.5 rounded-full bg-indigo-600 p-1.5 text-white transition-colors hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600"
            aria-label="Send message"
          >
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
}
