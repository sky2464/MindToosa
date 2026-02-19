import { auth } from "@auth";
import { projectService } from "@/server/services/projectService";
import { NextResponse } from "next/server";
import { z } from "zod";
import { handleRouteError } from "@/lib/routeError";

const ProjectCreateSchema = z
  .object({
    title: z.string().min(1),
    space_id: z.string().uuid(),
    description: z.string().optional(),
    status: z.enum(["active", "completed", "on_hold"]).optional(),
    due_date: z.string().date().optional(),
  })
  .strict();

export async function GET() {
  const session = await auth();
  const userId = session?.user?.email;
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const projects = await projectService.getProjects(userId);
    return NextResponse.json(projects);
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
    const parsed = ProjectCreateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const project = await projectService.createProject(userId, parsed.data);
    return NextResponse.json(project, { status: 201 });
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}
