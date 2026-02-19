"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Brain, BrainCircuit, Download, User } from "lucide-react";

interface SettingsClientProps {
    userEmail: string;
}

export default function SettingsClient({ userEmail }: SettingsClientProps) {
    const [aiEnabled, setAiEnabled] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const stored = localStorage.getItem("mindtoosa_ai_enabled");
        if (stored !== null) setAiEnabled(stored === "true");
    }, []);

    const toggleAI = () => {
        const next = !aiEnabled;
        setAiEnabled(next);
        localStorage.setItem("mindtoosa_ai_enabled", String(next));
    };

    const signOut = async () => {
        await fetch("/api/auth/signout", { method: "POST" });
        router.push("/");
        router.refresh();
    };

    return (
        <div className="mx-auto min-h-screen max-w-2xl p-6 pb-24 md:ml-20">
            <header className="mb-10">
                <h1 className="text-4xl font-black tracking-tight text-white">Settings</h1>
                <p className="mt-1 text-zinc-500">Manage your account and preferences.</p>
            </header>

            <div className="space-y-4">
                {/* Account */}
                <section className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6">
                    <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-zinc-400">
                        <User size={14} /> Account
                    </h2>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-white">{userEmail}</p>
                            <p className="text-sm text-zinc-500">Signed in with Google</p>
                        </div>
                        <button
                            onClick={signOut}
                            className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/50 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
                        >
                            <LogOut size={16} />
                            Sign Out
                        </button>
                    </div>
                </section>

                {/* AI Planning */}
                <section className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6">
                    <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-zinc-400">
                        <Brain size={14} /> AI Planning
                    </h2>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-white">AI Plan Generation</p>
                            <p className="text-sm text-zinc-500">
                                {aiEnabled
                                    ? "AI will generate your daily plan using Gemini."
                                    : "Manual planning mode — AI is disabled."}
                            </p>
                        </div>
                        <button
                            onClick={toggleAI}
                            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all ${aiEnabled
                                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500"
                                    : "border border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300"
                                }`}
                        >
                            {aiEnabled ? <Brain size={16} /> : <BrainCircuit size={16} />}
                            {aiEnabled ? "Enabled" : "Disabled"}
                        </button>
                    </div>
                </section>

                {/* Privacy */}
                <section className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6">
                    <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-zinc-400">
                        <Download size={14} /> Data & Privacy
                    </h2>
                    <p className="mb-4 text-sm text-zinc-500">
                        Your data is stored securely in Supabase. Only the minimum context is sent to the AI model
                        when planning is enabled.
                    </p>
                    <button
                        disabled
                        className="flex cursor-not-allowed items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/30 px-4 py-2 text-sm text-zinc-600"
                        title="Coming soon"
                    >
                        <Download size={16} />
                        Export Data (coming soon)
                    </button>
                </section>
            </div>
        </div>
    );
}
