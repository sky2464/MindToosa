"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Brain, BrainCircuit, Download, User } from "lucide-react";

interface SettingsClientProps {
    userEmail: string;
}

export default function SettingsClient({ userEmail }: SettingsClientProps) {
    const router = useRouter();
    const [settings, setSettings] = useState({
        theme: "system",
        working_hours_start: "09:00",
        working_hours_end: "17:00",
        notifications_enabled: false,
        timezone: "",
    });
    const [loadingSettings, setLoadingSettings] = useState(true);
    const [saving, setSaving] = useState(false);
    const [aiEnabled, setAiEnabled] = useState(false);

    useEffect(() => {
        // Fetch AI settings
        const stored = localStorage.getItem("mindtoosa_ai_enabled");
        if (stored !== null) setAiEnabled(stored === "true");

        // Fetch User Settings
        import("@/lib/apiClient").then(({ apiClient }) => {
            apiClient.get<typeof settings>("/api/settings")
                .then(data => {
                    setSettings(data);
                    setLoadingSettings(false);
                })
                .catch(() => setLoadingSettings(false));
        });
    }, []);

    const toggleAI = () => {
        const next = !aiEnabled;
        setAiEnabled(next);
        localStorage.setItem("mindtoosa_ai_enabled", String(next));
    };

    const handleSaveSettings = async () => {
        setSaving(true);
        try {
            const { apiClient } = await import("@/lib/apiClient");
            await apiClient.patch("/api/settings", settings);
            router.refresh();
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const signOut = async () => {
        await fetch("/api/auth/signout", { method: "POST" });
        router.push("/");
        router.refresh();
    };

    return (
        <div className="mx-auto min-h-screen max-w-2xl p-4 sm:p-6 lg:p-8 pb-24">
            <header className="mb-10">
                <h1 className="text-4xl font-black tracking-tight text-white">Settings</h1>
                <p className="mt-1 text-zinc-500">Manage your account and preferences.</p>
            </header>

            <div className="space-y-6">
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

                {/* Preferences */}
                <section className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-zinc-400">
                            Preferences
                        </h2>
                        {loadingSettings && <span className="text-xs text-zinc-600 animate-pulse">Loading...</span>}
                    </div>

                    <div className="space-y-6">
                        {/* Theme */}
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Theme</label>
                            <div className="flex gap-2 bg-zinc-900/50 p-1 rounded-xl">
                                {(["light", "dark", "system"] as const).map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => setSettings(prev => ({ ...prev, theme: t }))}
                                        className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all ${settings.theme === t ? "bg-indigo-600 text-white shadow-lg" : "text-zinc-400 hover:text-white"
                                            }`}
                                    >
                                        <span className="capitalize">{t}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Working Hours */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="working_hours_start" className="block text-xs font-bold text-zinc-500 uppercase mb-2">Start Time</label>
                                <input
                                    id="working_hours_start"
                                    type="time"
                                    value={settings.working_hours_start}
                                    onChange={(e) => setSettings(prev => ({ ...prev, working_hours_start: e.target.value }))}
                                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900/50 px-4 py-2 text-white outline-none focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="working_hours_end" className="block text-xs font-bold text-zinc-500 uppercase mb-2">End Time</label>
                                <input
                                    id="working_hours_end"
                                    type="time"
                                    value={settings.working_hours_end}
                                    onChange={(e) => setSettings(prev => ({ ...prev, working_hours_end: e.target.value }))}
                                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900/50 px-4 py-2 text-white outline-none focus:border-indigo-500"
                                />
                            </div>
                        </div>

                        {/* Timezone */}
                        <div>
                            <label htmlFor="timezone" className="block text-xs font-bold text-zinc-500 uppercase mb-2">Timezone</label>
                            <input
                                id="timezone"
                                type="text"
                                placeholder="e.g. America/New_York"
                                value={settings.timezone}
                                onChange={(e) => setSettings(prev => ({ ...prev, timezone: e.target.value }))}
                                list="tz-suggestions"
                                className="w-full rounded-xl border border-zinc-700 bg-zinc-900/50 px-4 py-2 text-white outline-none focus:border-indigo-500"
                            />
                            <datalist id="tz-suggestions">
                                <option value="UTC" />
                                <option value="America/New_York" />
                                <option value="America/Chicago" />
                                <option value="America/Denver" />
                                <option value="America/Los_Angeles" />
                                <option value="Europe/London" />
                                <option value="Europe/Berlin" />
                                <option value="Europe/Paris" />
                                <option value="Asia/Tokyo" />
                                <option value="Asia/Dubai" />
                                <option value="Asia/Kolkata" />
                                <option value="Australia/Sydney" />
                            </datalist>
                        </div>

                        {/* Notifications */}
                        <div className="flex items-center justify-between">
                            <label className="text-sm text-zinc-300">Enable Notifications</label>
                            <button
                                onClick={() => setSettings(prev => ({ ...prev, notifications_enabled: !prev.notifications_enabled }))}
                                className={`w-12 h-6 rounded-full transition-colors relative ${settings.notifications_enabled ? "bg-emerald-500" : "bg-zinc-700"
                                    }`}
                                aria-label={settings.notifications_enabled ? "Disable Notifications" : "Enable Notifications"}
                            >
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${settings.notifications_enabled ? "left-7" : "left-1"
                                    }`} />
                            </button>
                        </div>

                        <button
                            onClick={handleSaveSettings}
                            disabled={saving}
                            className="w-full rounded-xl bg-indigo-600 py-2.5 font-bold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 disabled:opacity-50 transition-all"
                        >
                            {saving ? "Saving..." : "Save Preferences"}
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
