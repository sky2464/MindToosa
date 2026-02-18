"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, ArchiveRestore, Loader2 } from "lucide-react";
import { Space } from "@/core/planTypes";

interface SpaceCardProps {
    space: Space;
}

export default function SpaceCard({ space }: SpaceCardProps) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const toggleArchive = async () => {
        setLoading(true);
        try {
            await fetch(`/api/spaces/${space.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ archived: !space.archived }),
            });
            router.refresh();
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="group flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/40 px-5 py-4 transition-all hover:border-zinc-700 hover:bg-zinc-900/60">
            <div className="flex items-center gap-3">
                <div className="h-2.5 w-2.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                <span className="font-medium text-white">{space.name}</span>
                {space.archived && (
                    <span className="rounded-full border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
                        Archived
                    </span>
                )}
            </div>
            <button
                onClick={toggleArchive}
                disabled={loading}
                title={space.archived ? "Restore space" : "Archive space"}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-zinc-600 opacity-0 transition-all hover:bg-zinc-800 hover:text-zinc-300 group-hover:opacity-100 disabled:opacity-50"
            >
                {loading ? (
                    <Loader2 size={14} className="animate-spin" />
                ) : space.archived ? (
                    <ArchiveRestore size={14} />
                ) : (
                    <Archive size={14} />
                )}
                {space.archived ? "Restore" : "Archive"}
            </button>
        </div>
    );
}
