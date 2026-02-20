import { auth } from "@auth";
import { taskService } from "@/server/services/taskService";
import { NextResponse } from "next/server";
import { TaskStatusSchema, TaskPrioritySchema } from "@/core/planTypes";
import { z } from "zod";
import { handleRouteError } from "@/lib/routeError";

/** Only fields a client is allowed to update */
const TaskUpdateSchema = z
  .object({
    title: z.string().min(1).optional(),
    status: TaskStatusSchema.optional(),
    priority: TaskPrioritySchema.optional(),
    estimated_minutes: z.number().int().min(1).optional(),
    scheduled_for: z.string().date().optional().nullable(),
    space_id: z.string().uuid().optional().nullable(),
    goal_id: z.string().uuid().optional().nullable(),
    project_id: z.string().uuid().optional().nullable(),
    micro_steps: z.array(z.string()).optional(),
    parent_task_id: z.string().uuid().optional().nullable(),
    position: z.number().int().optional(),
    recurrence_rule: z.string().optional().nullable(),
  })
  .strict(); // reject unknown fields

export async function PATCH(req: Request, { params }: { params: Promise<{ taskId: string }> }) {
  const session = await auth();
  const userId = session?.user?.email;
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const json = await req.json();
    const { taskId } = await params;

    const parsed = TaskUpdateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Strip null values to undefined to match Partial<Task> expectations
    const cleanedData = Object.fromEntries(
      Object.entries(parsed.data).map(([k, v]) => [k, v === null ? undefined : v])
    );

    const updatedTask = await taskService.updateTask(userId, taskId, cleanedData);
    return NextResponse.json(updatedTask);
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ taskId: string }> }) {
  const session = await auth();
  const userId = session?.user?.email;
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { taskId } = await params;
    await taskService.deleteTask(userId, taskId);
    return new NextResponse(null, { status: 204 });
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}
