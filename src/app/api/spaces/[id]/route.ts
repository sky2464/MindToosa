import { auth } from "@auth";
import { spaceService } from "@/server/services/spaceService";
import { NextResponse } from "next/server";
import { z } from "zod";
import { handleRouteError } from "@/lib/routeError";

const SpacePatchSchema = z
  .object({
    name: z.string().min(1).optional(),
    archived: z.boolean().optional(),
  })
  .strict();

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    const userId = session?.user?.email;
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    try {
        const { id } = await params;
        const json = await req.json();
        const parsed = SpacePatchSchema.safeParse(json);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Validation failed", details: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const { name, archived } = parsed.data;
        if (name === undefined && archived === undefined) {
            return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
        }

        let space;
        if (name !== undefined) {
            space = await spaceService.updateSpace(userId, id, { name });
        }
        if (archived !== undefined) {
            space = await spaceService.archiveSpace(userId, id, archived);
        }

        return NextResponse.json(space);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "An unknown error occurred";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
