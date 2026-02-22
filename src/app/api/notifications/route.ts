import { auth } from "@auth";
import { notificationService } from "@/server/services/notificationService";
import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/routeError";
import { jsonEnvelope } from "@/lib/apiEnvelope";

export async function GET() {
  const session = await auth();
  const userId = session?.user?.email;
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const notifications = await notificationService.getUnread(userId);
    return jsonEnvelope(notifications);
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}

export async function PATCH(req: Request) {
  const session = await auth();
  const userId = session?.user?.email;
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const json = await req.json();
    if (json.action === "mark_read" && json.id) {
      await notificationService.markAsRead(userId, json.id);
    } else if (json.action === "mark_all_read") {
      await notificationService.markAllAsRead(userId);
    }
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}
