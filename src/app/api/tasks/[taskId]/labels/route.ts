import { auth } from "@auth";
import { NextResponse } from "next/server";
import { labelService } from "@/server/services/labelService";
import { z } from "zod";
import { handleRouteError } from "@/lib/routeError";
import { jsonEnvelope } from "@/lib/apiEnvelope";

const LabelAssignSchema = z.object({
  label_id: z.string().uuid("Invalid label ID"),
});

export async function GET(_req: Request, { params }: { params: Promise<{ taskId: string }> }) {
  const session = await auth();
  const userId = session?.user?.email;
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const { taskId } = await params;

  try {
    const labels = await labelService.getTaskLabels(userId, taskId);
    return jsonEnvelope(labels);
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ taskId: string }> }) {
  const session = await auth();
  const userId = session?.user?.email;
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const { taskId } = await params;
  const body = await req.json();
  const parsed = LabelAssignSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.format() },
      { status: 400 }
    );
  }

  try {
    await labelService.assignLabel(userId, taskId, parsed.data.label_id);
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}
