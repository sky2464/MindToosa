import { auth } from "@auth";
import { NextResponse } from "next/server";
import { db } from "@/server/db";

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    const userId = session?.user?.email;
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const { id } = await params;
    const body = await req.json();

    // Only allow updating name and archived fields
    const allowed: Record<string, unknown> = {};
    if (typeof body.name === "string") allowed.name = body.name;
    if (typeof body.archived === "boolean") allowed.archived = body.archived;

    if (Object.keys(allowed).length === 0) {
        return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const { data, error } = await db
        .from("spaces")
        .update(allowed)
        .eq("id", id)
        .eq("user_id", userId)
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}
