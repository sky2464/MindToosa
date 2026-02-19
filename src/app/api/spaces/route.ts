import { auth } from "@auth";
import { spaceService } from "@/server/services/spaceService";
import { NextResponse } from "next/server";
import { z } from "zod";
import { handleRouteError } from "@/lib/routeError";
import { jsonEnvelope } from "@/lib/apiEnvelope";

const SpaceCreateSchema = z.object({ name: z.string().min(1) });

export async function GET() {
  const session = await auth();
  const userId = session?.user?.email;
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const spaces = await spaceService.getSpaces(userId);
    return jsonEnvelope(spaces.filter((s) => !s.archived));
  } catch (error: unknown) {
    return handleRouteError(error);
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
    const parsed = SpaceCreateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const space = await spaceService.createSpace(userId, parsed.data.name);
    return NextResponse.json(space);
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}