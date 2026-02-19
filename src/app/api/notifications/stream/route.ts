import { auth } from "@auth";
import { NextResponse } from "next/server";
import { notificationService } from "@/server/services/notificationService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * SSE endpoint for real-time notifications.
 * Replaces the 60s setInterval polling in NotificationsPanel.
 * The server polls the DB every 30s and pushes new unread notifications.
 */
export async function GET() {
  const session = await auth();
  const userId = session?.user?.email;
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          // Client disconnected — stop silently
        }
      };

      // Push initial payload immediately
      try {
        const notifications = await notificationService.getUnread(userId);
        send({ type: "notifications", data: notifications });
      } catch (err) {
        send({ type: "error", message: err instanceof Error ? err.message : "Unknown error" });
      }

      // Poll every 30 seconds
      const interval = setInterval(async () => {
        try {
          const notifications = await notificationService.getUnread(userId);
          send({ type: "notifications", data: notifications });
        } catch {
          // Don't crash the stream on a transient DB error
        }
      }, 30_000);

      // Keep-alive ping every 15 seconds to prevent proxy timeouts
      const ping = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          clearInterval(ping);
          clearInterval(interval);
        }
      }, 15_000);

      // Clean up when client disconnects
      return () => {
        clearInterval(interval);
        clearInterval(ping);
      };
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
