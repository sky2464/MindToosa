import { auth } from "@/auth";
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

  try {
    const tasks = await taskService.getTasks(userId, { spaceId, date });
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
    console.log("POST /api/tasks received payload:", JSON.stringify(json, null, 2));
    const task = await taskService.createTask(userId, json);
    console.log("Task created successfully:", task);
    return NextResponse.json(task);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "An unknown error occurred";
    console.error("POST /api/tasks error:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
