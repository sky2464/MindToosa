import { auth } from "@/auth";
import { NextResponse, NextRequest } from "next/server";
import { searchService } from "@/server/services/searchService";
import { rateLimit } from "@/server/rateLimit";

export async function GET(request: NextRequest) {
    const session = await auth();
    const userEmail = session?.user?.email;
    if (!userEmail) return new NextResponse("Unauthorized", { status: 401 });

    // In this app, we use email as user_id or look up user by email.
    // The previous code used session.user.email as user_id.
    // Assuming email is the ID for now as per previous implementation.
    const userId = userEmail;

    // Rate limiting: 20 requests per minute per user/IP
    // Using userId as key since we are authenticated
    if (!rateLimit(userId, { limit: 20, windowMs: 60000 })) {
        return new NextResponse("Too Many Requests", { status: 429 });
    }

    const q = request.nextUrl.searchParams.get("q") ?? "";

    try {
        const results = await searchService.search(userId, q);
        return NextResponse.json(results);
    } catch (error) {
        console.error("Search error:", error);
        return NextResponse.json({ error: "Search failed" }, { status: 500 });
    }
}
