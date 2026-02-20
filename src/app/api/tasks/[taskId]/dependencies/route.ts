import { auth } from "@auth";
import { taskService } from "@/server/services/taskService";
import { NextResponse } from "next/server";
import { z } from "zod";
import { handleRouteError } from "@/lib/routeError";
import { jsonEnvelope } from "@/lib/apiEnvelope";

const DependencySchema = z.object({
  blocking_task_id: z.string().uuid("Invalid blocking task ID"),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const session = await auth();
  const userId = session?.user?.email;
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const { taskId } = await params;
    const dependencies = await taskService.getDependencies(userId, taskId);
    return jsonEnvelope(dependencies);
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const session = await auth();
  const userId = session?.user?.email;
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const { taskId } = await params;
    const json = await req.json();
    const parsed = DependencySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const dep = await taskService.addDependency(userId, taskId, parsed.data.blocking_task_id);
    return NextResponse.json(dep, { status: 201 });
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const session = await auth();
  const userId = session?.user?.email;
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const { taskId } = await params;
    const json = await req.json();
    const parsed = DependencySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    await taskService.removeDependency(userId, taskId, parsed.data.blocking_task_id);
    return new NextResponse(null, { status: 204 });
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}
