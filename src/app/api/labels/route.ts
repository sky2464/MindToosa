import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { labelService } from "@/server/services/labelService";
import { z } from "zod";

const LabelCreateSchema = z.object({
    name: z.string().min(1, "Label name is required"),
    color: z.string().default("#6366f1"),
});

export async function GET() {
    const session = await auth();
    const userId = session?.user?.email;
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    try {
        const labels = await labelService.getLabels(userId);
        return NextResponse.json(labels);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to fetch labels";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await auth();
    const userId = session?.user?.email;
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const body = await req.json();
    const parsed = LabelCreateSchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json(
            { error: "Invalid label data", details: parsed.error.format() },
            { status: 400 }
        );
    }

    try {
        const label = await labelService.createLabel(userId, parsed.data.name, parsed.data.color);
        return NextResponse.json(label, { status: 201 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to create label";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
