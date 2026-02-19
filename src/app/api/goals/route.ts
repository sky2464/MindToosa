import { auth } from "@auth";
import { goalService } from "@/server/services/goalService";
import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/routeError";
import { jsonEnvelope } from "@/lib/apiEnvelope";

export async function GET(req: Request) {
    const session = await auth();
    const userId = session?.user?.email;
    if (!userId) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const archived = searchParams.get("archived") === "true";
    const spaceId = searchParams.get("spaceId") || undefined;

    try {
        const goals = await goalService.getGoals(userId, { archived, spaceId });
        return jsonEnvelope(goals);
    } catch (error: unknown) {
        return handleRouteError(error);
    }
}

export async function POST(req: Request) {
    const session = await auth();
    const userId = session?.user?.email;
    if (!userId) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const json = await req.json();
        const goal = await goalService.createGoal(userId, json);
        return NextResponse.json(goal);
    } catch (error: unknown) {
        return handleRouteError(error);
    }
}
