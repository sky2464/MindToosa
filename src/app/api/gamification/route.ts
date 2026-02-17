import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { NextResponse } from "next/server";
import { gamificationService } from "@/server/services/gamificationService";

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const stats = await gamificationService.getStats(session.user.id);
        return NextResponse.json(stats);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "An unknown error occurred";
        return NextResponse.json({ error: message }, { status: 400 });
    }
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { action, amount } = body;

        if (action === "add_xp") {
            const stats = await gamificationService.addXP(session.user.id, amount || 10);
            return NextResponse.json(stats);
        }

        if (action === "update_streak") {
            const stats = await gamificationService.updateStreak(session.user.id);
            return NextResponse.json(stats);
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "An unknown error occurred";
        return NextResponse.json({ error: message }, { status: 400 });
    }
}
