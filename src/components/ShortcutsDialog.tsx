"use client";

import { useState, useEffect } from "react";
import { X, Keyboard } from "lucide-react";

const SHORTCUTS = [
    { keys: ["⌘", "K"], description: "Open search" },
    { keys: ["?"], description: "Show keyboard shortcuts" },
    { keys: ["Esc"], description: "Close dialog / modal" },
];

export default function ShortcutsDialog() {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            const isTyping = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
            if (e.key === "?" && !e.metaKey && !e.ctrlKey && !isTyping) {
                setOpen(true);
            }
            if (e.key === "Escape") setOpen(false);
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, []);

    if (!open) {
        return (
            <button
                onClick={() => setOpen(true)}
                className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/90 px-3 py-2 text-xs font-medium text-zinc-500 shadow-lg backdrop-blur-sm transition hover:border-zinc-600 hover:text-zinc-300"
                title="Keyboard shortcuts (?)"
                aria-label="Show keyboard shortcuts"
            >
                <Keyboard size={14} />
                <span className="hidden sm:inline">Shortcuts</span>
            </button>
        );
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
            <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-zinc-950 shadow-2xl shadow-indigo-500/10">
                <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
                    <div className="flex items-center gap-2">
                        <Keyboard size={18} className="text-indigo-400" />
                        <h2 className="font-bold text-white">Keyboard Shortcuts</h2>
                    </div>
                    <button
                        onClick={() => setOpen(false)}
                        className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
                        aria-label="Close"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="divide-y divide-white/5 p-2">
                    {SHORTCUTS.map((s, i) => (
                        <div key={i} className="flex items-center justify-between px-4 py-3">
                            <span className="text-sm text-zinc-400">{s.description}</span>
                            <div className="flex gap-1">
                                {s.keys.map((key, j) => (
                                    <kbd
                                        key={j}
                                        className="inline-flex min-w-[24px] items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800/50 px-2 py-1 text-[11px] font-mono font-bold text-zinc-400"
                                    >
                                        {key}
                                    </kbd>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
