import { db } from "@/server/db";
import { AppError } from "@/lib/errors";

export interface SearchResult {
    id: string;
    type: "task" | "project" | "goal";
    title: string;
    href: string;
    status: string;
}

export const searchService = {
    async search(userId: string, query: string): Promise<SearchResult[]> {
        if (!query.trim()) return [];

        const term = `%${query}%`;

        try {
            // Search across tasks, projects, and goals in parallel
            const [tasksResult, projectsResult, goalsResult] = await Promise.all([
                db.from("tasks")
                    .select("id, title, status")
                    .eq("user_id", userId)
                    .ilike("title", term)
                    .limit(10),
                db.from("projects")
                    .select("id, title, status")
                    .eq("user_id", userId)
                    .ilike("title", term)
                    .limit(5),
                db.from("goals")
                    .select("id, title, archived")
                    .eq("user_id", userId)
                    .ilike("title", term)
                    .limit(5),
            ]);

            // Check for errors in results
            if (tasksResult.error) throw new AppError(tasksResult.error.message, "DB_ERROR");
            if (projectsResult.error) throw new AppError(projectsResult.error.message, "DB_ERROR");
            if (goalsResult.error) throw new AppError(goalsResult.error.message, "DB_ERROR");

            const results: SearchResult[] = [
                ...(tasksResult.data ?? []).map((t) => ({
                    id: t.id,
                    type: "task" as const,
                    title: t.title,
                    href: `/today`, // Could be improved to link to specific task context
                    status: t.status,
                })),
                ...(projectsResult.data ?? []).map((p) => ({
                    id: p.id,
                    type: "project" as const,
                    title: p.title,
                    href: `/projects/${p.id}`,
                    status: p.status,
                })),
                ...(goalsResult.data ?? []).map((g) => ({
                    id: g.id,
                    type: "goal" as const,
                    title: g.title,
                    href: `/today`,
                    status: g.archived ? "archived" : "active",
                })),
            ];

            return results;
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(error instanceof Error ? error.message : "Unknown search error", "SEARCH_ERROR");
        }
    }
};
