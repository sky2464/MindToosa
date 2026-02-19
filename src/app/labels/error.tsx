"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Page error:", error);
    }, [error]);

    return (
        <div className="flex min-h-[60vh] items-center justify-center p-6">
            <div className="glass-card mx-auto max-w-md space-y-6 rounded-2xl p-8 text-center">
                <div className="flex justify-center">
                    <div className="rounded-full bg-red-500/10 p-4">
                        <AlertTriangle className="h-8 w-8 text-red-400" />
                    </div>
                </div>
                <div>
                    <h2 className="text-xl font-bold text-foreground">Something went wrong</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        An unexpected error occurred. Please try again or contact support if the problem persists.
                    </p>
                    {error.digest && (
                        <p className="mt-2 font-mono text-xs text-zinc-600">Error ID: {error.digest}</p>
                    )}
                </div>
                <button
                    onClick={reset}
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
                >
                    <RotateCcw size={16} />
                    Try Again
                </button>
            </div>
        </div>
    );
}
