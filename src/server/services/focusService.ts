import { db } from "@/server/db";
import { FocusSessionSchema, FocusSession } from "@/core/planTypes";

export const focusService = {
    async createSession(userId: string, sessionData: Partial<FocusSession>) {
        // Ensure user_id is set
        const payload = { ...sessionData, user_id: userId };

        // Validate with Zod
        // Note: Zod schema has some optional fields that might be required by DB if not nullable,
        // but looking at planTypes.ts, most are optional or have defaults.
        // We might need to transform Date objects to strings if the raw JSON comes in that way,
        // but for now we assume the caller passes compatible types or we let Zod handle coercion if configured.
        // The schema expects Dates for started_at.

        const validation = FocusSessionSchema.safeParse(payload);

        if (!validation.success) {
            throw new Error("Validation failed: " + JSON.stringify(validation.error.format()));
        }

        const { data, error } = await db
            .from("focus_sessions")
            .insert(validation.data)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data as FocusSession;
    },

    async getSessions(userId: string) {
        const { data, error } = await db
            .from("focus_sessions")
            .select("*")
            .eq("user_id", userId)
            .order("started_at", { ascending: false });

        if (error) throw new Error(error.message);
        return data as FocusSession[];
    }
};
