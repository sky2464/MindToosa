import { auth } from "@/auth";
import { NextResponse, NextRequest } from "next/server";
import { db } from "@/server/db";

export async function GET(request: NextRequest) {
    const session = await auth();
    const userId = session?.user?.email;
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const q = request.nextUrl.searchParams.get("q") ?? "";
    if (!q.trim()) return NextResponse.json([]);

    const term = `%${q}%`;

    // Search across tasks, projects, and goals in parallel
    const [tasksResult, projectsResult, goalsResult] = await Promise.all([
        db.from("tasks").select("id, title, status").eq("user_id", userId).ilike("title", term).limit(10),
        db.from("projects").select("id, title, status").eq("user_id", userId).ilike("title", term).limit(5),
        db.from("goals").select("id, title, status").eq("user_id", userId).ilike("title", term).limit(5),
    ]);

    type SearchResult = { id: string; type: string; title: string; href: string; status: string };

    const results: SearchResult[] = [
        ...(tasksResult.data ?? []).map((t: Record<string, string>) => ({
            id: t.id,
            type: "task" as const,
            title: t.title,
            href: `/today`,
            status: t.status,
        })),
        ...(projectsResult.data ?? []).map((p: Record<string, string>) => ({
            id: p.id,
            type: "project" as const,
            title: p.title,
            href: `/projects/${p.id}`,
            status: p.status,
        })),
        ...(goalsResult.data ?? []).map((g: Record<string, string>) => ({
            id: g.id,
            type: "goal" as const,
            title: g.title,
            href: `/today`,
            status: g.status,
        })),
    ];

    return NextResponse.json(results);
}
