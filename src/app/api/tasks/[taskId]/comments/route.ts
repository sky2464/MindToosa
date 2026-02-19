import { auth } from "@auth";
import { taskService } from "@/server/services/taskService";
import { NextResponse } from "next/server";
import { z } from "zod";
import { handleRouteError } from "@/lib/routeError";

const CommentCreateSchema = z.object({
    content: z.string().min(1, "Comment cannot be empty"),
});

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ taskId: string }> }
) {
    const session = await auth();
    const userId = session?.user?.email;
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const { taskId } = await params;

    try {
        const comments = await taskService.getComments(userId, taskId);
        return NextResponse.json(comments);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to fetch comments";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function POST(
    req: Request,
    { params }: { params: Promise<{ taskId: string }> }
) {
    const session = await auth();
    const userId = session?.user?.email;
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const { taskId } = await params;
    const body = await req.json();
    const parsed = CommentCreateSchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json(
            { error: "Invalid comment data", details: parsed.error.format() },
            { status: 400 }
        );
    }

    try {
        const comment = await taskService.createComment(userId, taskId, parsed.data.content);
        return NextResponse.json(comment, { status: 201 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to create comment";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
