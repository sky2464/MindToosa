import { auth } from "@/auth";
import { notificationService } from "@/server/services/notificationService";
import { NextResponse } from "next/server";

export async function GET() {
    const session = await auth();
    const userId = session?.user?.email;
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    try {
        const notifications = await notificationService.getUnread(userId);
        return NextResponse.json(notifications);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "An unknown error occurred";
        return NextResponse.json({ error: message }, { status: 500 });
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
        const message = error instanceof Error ? error.message : "An unknown error occurred";
        return NextResponse.json({ error: message }, { status: 400 });
    }
}
