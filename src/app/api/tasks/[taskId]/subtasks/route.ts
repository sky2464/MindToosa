import { auth } from "@auth";
import { taskService } from "@/server/services/taskService";
import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/routeError";
import { jsonEnvelope } from "@/lib/apiEnvelope";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const session = await auth();
  const userId = session?.user?.email;
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const { taskId } = await params;
    const subtasks = await taskService.getTasks(userId, { parentId: taskId });
    return jsonEnvelope(subtasks);
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}
