import { auth } from "@auth";
import { NextResponse } from "next/server";
import { labelService } from "@/server/services/labelService";
import { handleRouteError } from "@/lib/routeError";

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ taskId: string; labelId: string }> }
) {
    const session = await auth();
    const userId = session?.user?.email;
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const { taskId, labelId } = await params;

    try {
        await labelService.unassignLabel(userId, taskId, labelId);
        return new NextResponse(null, { status: 204 });
    } catch (error: unknown) {
        return handleRouteError(error);
    }
}
