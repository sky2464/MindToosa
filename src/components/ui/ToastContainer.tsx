"use client";

import { X, CheckCircle, AlertCircle, Info } from "lucide-react";
import { type Toast } from "@/hooks/useToast";

interface ToastContainerProps {
    toasts: Toast[];
    onDismiss: (id: string) => void;
}

const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
} as const;

const styles = {
    success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    error: "border-red-500/30 bg-red-500/10 text-red-300",
    info: "border-indigo-500/30 bg-indigo-500/10 text-indigo-300",
} as const;

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2" aria-live="polite">
            {toasts.map((toast) => {
                const Icon = icons[toast.type];
                return (
                    <div
                        key={toast.id}
                        className={`flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm animate-slide-up ${styles[toast.type]}`}
                    >
                        <Icon size={16} className="shrink-0" />
                        <span className="text-sm font-medium">{toast.message}</span>
                        <button
                            onClick={() => onDismiss(toast.id)}
                            className="ml-2 shrink-0 rounded-lg p-0.5 opacity-50 transition-opacity hover:opacity-100"
                            aria-label="Dismiss notification"
                        >
                            <X size={14} />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
