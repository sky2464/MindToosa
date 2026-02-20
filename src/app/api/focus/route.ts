import { auth } from "@auth";
import { NextResponse } from "next/server";
import { focusService } from "@/server/services/focusService";
import { handleRouteError } from "@/lib/routeError";
import { createTracer } from "@/lib/logger";
import { jsonEnvelope } from "@/lib/apiEnvelope";
import { z } from "zod";

const FocusPostSchema = z.object({
  task_id: z.string().uuid().optional().nullable(),
  started_at: z.union([z.string().datetime(), z.date()]),
  duration_minutes: z.number().int().min(1).max(480),
  completed: z.boolean().optional().default(false),
});

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.email;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tracer = createTracer(request, userId);

  try {
    const raw = await request.json();
    const parsed = FocusPostSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const body = {
      ...parsed.data,
      started_at: new Date(parsed.data.started_at as string),
    };
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
