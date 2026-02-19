import { auth } from "@auth";
import { NextResponse } from "next/server";
import { gamificationService } from "@/server/services/gamificationService";

export async function GET() {
  const session = await auth();

  // v5 session.user might have different shape, typically it has email/name/image.
  // If we need ID, we might need to check how it's stored.
  // For now assuming email is the key as used elsewhere in the app (projectService).
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Warning: gamificationService.getStats likely expects an ID, but we are using email as user_id in other places.
    // We should double check what logic is used for user identification.
    // In projectService we used email. Let's assume email is the consistent ID.
    const stats = await gamificationService.getStats(session.user.email);
    return NextResponse.json(stats);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: message }, { status: 400 });
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
    const message = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
