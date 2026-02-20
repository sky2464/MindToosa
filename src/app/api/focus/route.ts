import { auth } from "@auth";
import { NextResponse } from "next/server";
import { focusService } from "@/server/services/focusService";
import { handleRouteError } from "@/lib/routeError";
import { createTracer } from "@/lib/logger";
import { jsonEnvelope } from "@/lib/apiEnvelope";

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.email;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tracer = createTracer(request, userId);

  try {
    const body = await request.json();
    if (body.started_at && typeof body.started_at === "string") {
      body.started_at = new Date(body.started_at);
    }
    const savedSession = await focusService.createSession(userId, body);
    tracer.end(200);
    return NextResponse.json(savedSession);
  } catch (error: unknown) {
    tracer.error(error);
    return handleRouteError(error);
  }
}

export async function GET(request: Request) {
  const session = await auth();
  const userId = session?.user?.email;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tracer = createTracer(request, userId);

  try {
    const sessions = await focusService.getSessions(userId);
    tracer.end(200, { count: sessions.length });
    return jsonEnvelope(sessions);
  } catch (error: unknown) {
    tracer.error(error);
    return handleRouteError(error);
  }
}
