import { auth } from "@auth";
import { NextResponse } from "next/server";
import { labelService } from "@/server/services/labelService";
import { z } from "zod";
import { handleRouteError } from "@/lib/routeError";

const LabelUpdateSchema = z
  .object({
    name: z.string().min(1).optional(),
    color: z.string().optional(),
  })
  .strict();

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const userId = session?.user?.email;
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const { id } = await params;
    const json = await req.json();
    const parsed = LabelUpdateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const label = await labelService.updateLabel(userId, id, parsed.data);
    return NextResponse.json(label);
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const userId = session?.user?.email;
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const { id } = await params;
    await labelService.deleteLabel(userId, id);
    return new NextResponse(null, { status: 204 });
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}
