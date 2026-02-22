"use client";

import { useState, useEffect } from "react";
import { Bell, Check, X } from "lucide-react";
import { useRouter } from "next/navigation";

interface Notification {
  id: string;
  title: string;
  message?: string;
  type: "info" | "success" | "warning" | "error";
  created_at: string;
  read: boolean;
}

export default function NotificationsPanel({ direction = "down" }: { direction?: "up" | "down" }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const fetchValidations = async () => {
    try {
      const { apiClient } = await import("@/lib/apiClient");
      const data = await apiClient.get<Notification[]>("/api/notifications");
      setNotifications(data);
    } catch {
      // Non-critical — notifications silently unavailable
    }
  };

  useEffect(() => {
    // Use SSE stream for real-time pushes; fall back to initial fetch if EventSource fails
    const es = new EventSource("/api/notifications/stream");

    es.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string);
        if (msg.type === "notifications") {
          setNotifications(msg.data as Notification[]);
        }
      } catch {
        // Malformed payload — ignore
      }
    };

    es.onerror = () => {
      // SSE failed (e.g., server restart); close and fall back to one-time fetch
      es.close();
      import("@/lib/apiClient").then(({ apiClient }) =>
        apiClient
          .get<Notification[]>("/api/notifications")
          .then(setNotifications)
          .catch(() => {
            // Fallback also failed — notifications unavailable
          })
      );
    };

    return () => es.close();
  }, []);

  const markAsRead = async (id: string) => {
    try {
      const { apiClient } = await import("@/lib/apiClient");
      await apiClient.patch("/api/notifications", { action: "mark_read", id });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch {
      // Optimistic UI already updated — silently ignore
    }
  };

  const markAllRead = async () => {
    try {
      const { apiClient } = await import("@/lib/apiClient");
      await apiClient.patch("/api/notifications", { action: "mark_all_read" });
      setNotifications([]);
    } catch {
      // Optimistic UI already updated — silently ignore
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-zinc-400 transition-colors hover:text-white"
        aria-label="Notifications"
        title="Notifications"
      >
        <Bell size={20} />
        {notifications.length > 0 && (
          <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full border border-zinc-950 bg-red-500" />
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div
            className={`absolute right-0 ${direction === "up" ? "bottom-full mb-2" : "mt-2"} z-50 w-80 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl`}
          >
            <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/50 p-3">
              <h3 className="text-sm font-bold text-zinc-300">Notifications</h3>
              {notifications.length > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-indigo-400 hover:text-indigo-300"
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-64 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-sm text-zinc-500">No new notifications</div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className="flex gap-3 border-b border-zinc-800/50 p-3 transition-colors hover:bg-zinc-900/50"
                  >
                    <div
                      className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                        n.type === "error"
                          ? "bg-red-500"
                          : n.type === "success"
                            ? "bg-emerald-500"
                            : n.type === "warning"
                              ? "bg-amber-500"
                              : "bg-blue-500"
                      }`}
                    />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-zinc-200">{n.title}</h4>
                      {n.message && <p className="mt-0.5 text-xs text-zinc-500">{n.message}</p>}
                      <p className="mt-1 text-[10px] text-zinc-600">
                        {new Date(n.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                    <button
                      onClick={() => markAsRead(n.id)}
                      className="self-start text-zinc-600 hover:text-zinc-400"
                      aria-label="Dismiss notification"
                      title="Dismiss"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
