import { auth } from "@auth";
import { goalService, GoalUpdateSchema } from "@/server/services/goalService";
import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/routeError";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const userId = session?.user?.email;
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { id } = await params;
    const json = await req.json();
    const parsed = GoalUpdateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const updatedGoal = await goalService.updateGoal(userId, id, parsed.data);
    return NextResponse.json(updatedGoal);
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const userId = session?.user?.email;
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { id } = await params;
    await goalService.deleteGoal(userId, id);
    return new NextResponse(null, { status: 204 });
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}
