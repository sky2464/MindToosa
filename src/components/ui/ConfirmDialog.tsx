"use client";

import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: "danger" | "default";
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmDialog({
    isOpen,
    title,
    message,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    variant = "default",
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl animate-slide-up">
                <div className="flex items-start gap-3">
                    {variant === "danger" && (
                        <div className="shrink-0 rounded-full bg-red-500/10 p-2">
                            <AlertTriangle size={20} className="text-red-400" />
                        </div>
                    )}
                    <div className="flex-1">
                        <h3 className="text-base font-semibold text-white">{title}</h3>
                        <p className="mt-1 text-sm text-zinc-400">{message}</p>
                    </div>
                </div>
                <div className="mt-5 flex justify-end gap-2">
                    <button
                        onClick={onCancel}
                        className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-400 transition-colors hover:border-zinc-700 hover:text-white"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${variant === "danger"
                                ? "bg-red-500/20 text-red-300 hover:bg-red-500/30"
                                : "bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30"
                            }`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
