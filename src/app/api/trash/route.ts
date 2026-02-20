import { auth } from "@auth";
import { taskService } from "@/server/services/taskService";
import { NextResponse } from "next/server";
import { z } from "zod";
import { handleRouteError } from "@/lib/routeError";
import { jsonEnvelope } from "@/lib/apiEnvelope";

const TrashActionSchema = z.object({
  taskId: z.string().uuid(),
  action: z.enum(["restore", "permanent_delete"]),
});

export async function GET() {
  const session = await auth();
  const userId = session?.user?.email;
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const tasks = await taskService.getDeletedTasks(userId);
    return jsonEnvelope(tasks);
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}

export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.email;
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const json = await req.json();
    const parsed = TrashActionSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { taskId, action } = parsed.data;
    if (action === "restore") {
      await taskService.restoreTask(userId, taskId);
    } else {
      await taskService.permanentlyDeleteTask(userId, taskId);
    }
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}
