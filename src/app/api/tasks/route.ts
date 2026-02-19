import { auth } from "@auth";
import { taskService } from "@/server/services/taskService";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  const userId = session?.user?.email;
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const spaceId = searchParams.get("spaceId") || undefined;
  const date = searchParams.get("date") || undefined;
  const parentId = searchParams.get("parentId") || undefined;

  try {
    const tasks = await taskService.getTasks(userId, { spaceId, date, parentId });
    return NextResponse.json(tasks);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.email;
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const json = await req.json();
    const task = await taskService.createTask(userId, json);
    return NextResponse.json(task);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
