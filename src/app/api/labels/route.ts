import { auth } from "@auth";
import { NextResponse } from "next/server";
import { labelService } from "@/server/services/labelService";
import { z } from "zod";
import { handleRouteError } from "@/lib/routeError";
import { jsonEnvelope } from "@/lib/apiEnvelope";

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
        return jsonEnvelope(labels);
    } catch (error: unknown) {
        return handleRouteError(error);
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
        return handleRouteError(error);
    }
}
