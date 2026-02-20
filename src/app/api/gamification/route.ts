import { auth } from "@auth";
import { NextResponse } from "next/server";
import { gamificationService } from "@/server/services/gamificationService";
import { handleRouteError } from "@/lib/routeError";
import { jsonEnvelope } from "@/lib/apiEnvelope";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const stats = await gamificationService.getStats(session.user.email);
    return jsonEnvelope(stats);
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, amount } = body;

    if (action === "add_xp") {
      const stats = await gamificationService.addXP(session.user.email, amount || 10);
      return NextResponse.json(stats);
    }

    if (action === "update_streak") {
      const stats = await gamificationService.updateStreak(session.user.email);
      return NextResponse.json(stats);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}
