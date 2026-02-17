import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { focusService } from "@/server/services/focusService";

export async function POST(request: Request) {
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();

        // Ensure started_at is a Date object if it's sent as a string
        if (body.started_at && typeof body.started_at === 'string') {
            body.started_at = new Date(body.started_at);
        }

        const savedSession = await focusService.createSession(session.user.id, body);
        return NextResponse.json(savedSession);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}

export async function GET(request: Request) {
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const sessions = await focusService.getSessions(session.user.id);
        return NextResponse.json(sessions);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
