import { auth } from "@auth";
import { taskService } from "@/server/services/taskService";
import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/routeError";
import { createTracer } from "@/lib/logger";
import { jsonEnvelope } from "@/lib/apiEnvelope";

export async function GET(req: Request) {
  const session = await auth();
  const userId = session?.user?.email;
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const tracer = createTracer(req, userId);

  const { searchParams } = new URL(req.url);
  const spaceId = searchParams.get("spaceId") || undefined;
  const date = searchParams.get("date") || undefined;
  const parentId = searchParams.get("parentId") || undefined;
  const pageSize = Math.min(Number(searchParams.get("pageSize") ?? "200"), 200);
  const page = Math.max(Number(searchParams.get("page") ?? "1"), 1);
  const offset = (page - 1) * pageSize;

  try {
    const tasks = await taskService.getTasks(userId, {
      spaceId,
      date,
      parentId,
      limit: pageSize,
      offset,
    });
    tracer.end(200, { count: tasks.length });
    return jsonEnvelope(tasks, { page, pageSize, total: tasks.length });
  } catch (error: unknown) {
    tracer.error(error);
    return handleRouteError(error);
  }
}

export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.email;
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const tracer = createTracer(req, userId);

  try {
    const json = await req.json();
    const task = await taskService.createTask(userId, json);
    tracer.end(200, { taskId: task.id });
    return NextResponse.json(task);
  } catch (error: unknown) {
    tracer.error(error);
    return handleRouteError(error);
  }
}
