import { auth } from "@auth";
import { NextResponse } from "next/server";
import { focusService } from "@/server/services/focusService";
import { handleRouteError } from "@/lib/routeError";

export async function POST(request: Request) {
  const session = await auth();

  // Use email as ID to prevent foreign key errors if UUID was expected but not available in session
  // focus table uses text for user_id so email is fine.
  const userId = session?.user?.email;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Ensure started_at is a Date object if it's sent as a string
    if (body.started_at && typeof body.started_at === "string") {
      body.started_at = new Date(body.started_at);
    }

    const savedSession = await focusService.createSession(userId, body);
    return NextResponse.json(savedSession);
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}

export async function GET() {
  const session = await auth();
  const userId = session?.user?.email;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sessions = await focusService.getSessions(userId);
    return NextResponse.json(sessions);
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}
