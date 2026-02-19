"use client";

import { useState, useEffect } from "react";
import { X, Save, Loader2, Monitor, Sun, Moon } from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import { useRouter } from "next/navigation";

interface UserSettings {
    theme: "light" | "dark" | "system";
    working_hours_start: string;
    working_hours_end: string;
    notifications_enabled: boolean;
}

interface UserSettingsModalProps {
    onClose: () => void;
}

export default function UserSettingsModal({ onClose }: UserSettingsModalProps) {
    const router = useRouter();
    const [settings, setSettings] = useState<UserSettings>({
        theme: "system",
        working_hours_start: "09:00",
        working_hours_end: "17:00",
        notifications_enabled: false,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        // Fetch settings
        apiClient.get<UserSettings>("/api/settings")
            .then(data => {
                setSettings(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch settings", err);
                setLoading(false);
                // Default settings are already set
            });
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setError("");
        try {
            await apiClient.patch("/api/settings", settings);
            router.refresh();
            onClose();
        } catch (err) {
            setError("Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                <Loader2 className="animate-spin text-white" />
            </div>
        );
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="w-full max-w-md rounded-3xl border border-white/10 bg-zinc-950 shadow-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white">Settings</h2>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Theme */}
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Theme</label>
                        <div className="flex gap-2 bg-zinc-900/50 p-1 rounded-xl">
                            {(["light", "dark", "system"] as const).map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setSettings({ ...settings, theme: t })}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${settings.theme === t ? "bg-indigo-600 text-white shadow-lg" : "text-zinc-400 hover:text-white"
                                        }`}
                                >
                                    {t === "light" && <Sun size={14} />}
                                    {t === "dark" && <Moon size={14} />}
                                    {t === "system" && <Monitor size={14} />}
                                    <span className="capitalize">{t}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Working Hours */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Start Time</label>
                            <input
                                type="time"
                                value={settings.working_hours_start}
                                onChange={(e) => setSettings({ ...settings, working_hours_start: e.target.value })}
                                className="w-full rounded-xl border border-zinc-700 bg-zinc-900/50 px-4 py-2 text-white outline-none focus:border-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">End Time</label>
                            <input
                                type="time"
                                value={settings.working_hours_end}
                                onChange={(e) => setSettings({ ...settings, working_hours_end: e.target.value })}
                                className="w-full rounded-xl border border-zinc-700 bg-zinc-900/50 px-4 py-2 text-white outline-none focus:border-indigo-500"
                            />
                        </div>
                    </div>

                    {/* Notifications */}
                    <div className="flex items-center justify-between">
                        <label className="text-sm text-zinc-300">Enable Notifications</label>
                        <button
                            onClick={() => setSettings({ ...settings, notifications_enabled: !settings.notifications_enabled })}
                            className={`w-12 h-6 rounded-full transition-colors relative ${settings.notifications_enabled ? "bg-emerald-500" : "bg-zinc-700"
                                }`}
                        >
                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${settings.notifications_enabled ? "left-7" : "left-1"
                                }`} />
                        </button>
                    </div>
                </div>

                {error && <p className="mt-4 text-sm text-red-400 text-center">{error}</p>}

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full mt-8 rounded-xl bg-indigo-600 py-3 font-bold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 disabled:opacity-50 flex justify-center gap-2"
                >
                    {saving && <Loader2 className="animate-spin" />}
                    Save Changes
                </button>
            </div>
        </div>
    );
}
