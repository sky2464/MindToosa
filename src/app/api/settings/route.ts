import { auth } from "@auth";
import { userService } from "@/server/services/userService";
import { NextResponse } from "next/server";

export async function GET() {
    const session = await auth();
    const userId = session?.user?.email;
    if (!userId) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const settings = await userService.getSettings(userId);
        return NextResponse.json(settings);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "An unknown error occurred";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    const session = await auth();
    const userId = session?.user?.email;
    if (!userId) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const json = await req.json();
        const settings = await userService.updateSettings(userId, json);
        return NextResponse.json(settings);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "An unknown error occurred";
        return NextResponse.json({ error: message }, { status: 400 });
    }
}
