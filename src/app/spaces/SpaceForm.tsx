"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/apiClient";

const PRESET_SPACES = ["Work", "Personal", "Family & Friends"];

export default function SpaceForm() {
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const createSpace = async (spaceName: string) => {
        setLoading(true);
        setError("");
        try {
            await apiClient.post("/api/spaces", { name: spaceName });
            setName("");
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create space");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        createSpace(name.trim());
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="mb-3 text-xs font-bold tracking-widest text-zinc-500 uppercase">
                    Quick Add
                </h3>
                <div className="flex flex-wrap gap-2">
                    {PRESET_SPACES.map((preset) => (
                        <button
                            key={preset}
                            onClick={() => createSpace(preset)}
                            disabled={loading}
                            className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-1.5 text-sm text-zinc-300 transition-all hover:border-indigo-500/50 hover:bg-indigo-500/10 hover:text-white disabled:opacity-50"
                        >
                            + {preset}
                        </button>
                    ))}
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
                <h3 className="text-xs font-bold tracking-widest text-zinc-500 uppercase">
                    Custom Space
                </h3>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Side Project"
                        className="flex-1 rounded-xl border border-zinc-700 bg-zinc-900/50 px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30"
                    />
                    <button
                        type="submit"
                        disabled={loading || !name.trim()}
                        className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-500 disabled:opacity-50"
                    >
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                        Add
                    </button>
                </div>
                {error && <p className="text-sm text-red-400">{error}</p>}
            </form>
        </div>
    );
}
