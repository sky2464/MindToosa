import { auth } from "@auth";
import { NextResponse, NextRequest } from "next/server";
import { searchService } from "@/server/services/searchService";
import { rateLimit } from "@/server/rateLimit";
import { createTracer } from "@/lib/logger";
import { jsonEnvelope } from "@/lib/apiEnvelope";
import { handleRouteError } from "@/lib/routeError";

export async function GET(request: NextRequest) {
    const session = await auth();
    const userEmail = session?.user?.email;
    if (!userEmail) return new NextResponse("Unauthorized", { status: 401 });

    const userId = userEmail;
    const tracer = createTracer(request, userId);

    if (!(await rateLimit(userId, { limit: 20, windowMs: 60000 }))) {
        return new NextResponse("Too Many Requests", { status: 429 });
    }

    const q = request.nextUrl.searchParams.get("q") ?? "";

    try {
        const results = await searchService.search(userId, q);
        tracer.end(200, { q, resultCount: Array.isArray(results) ? results.length : 0 });
        return jsonEnvelope(results);
    } catch (error: unknown) {
        tracer.error(error);
        return handleRouteError(error);
    }
}
