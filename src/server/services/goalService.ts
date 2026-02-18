import { db } from "@/server/db";
import { Goal, GoalSchema } from "@/core/planTypes";

export const goalService = {
    async getGoals(userId: string, options: { archived?: boolean; spaceId?: string } = {}) {
        let query = db.from("goals").select("*").eq("user_id", userId);

        if (options.archived !== undefined) {
            query = query.eq("archived", options.archived);
        }

        if (options.spaceId) {
            query = query.eq("space_id", options.spaceId);
        }

        const { data, error } = await query.order("created_at", { ascending: false });

        if (error) throw new Error(error.message);
        return data as Goal[];
    },

    async createGoal(userId: string, goalData: Partial<Goal>) {
        const payload = { ...goalData, user_id: userId };
        const validation = GoalSchema.safeParse(payload);

        if (!validation.success) {
            throw new Error("Validation failed: " + JSON.stringify(validation.error.format()));
        }

        const { data, error } = await db.from("goals").insert(validation.data).select().single();

        if (error) throw new Error(error.message);
        return data as Goal;
    },

    async updateGoal(userId: string, goalId: string, updates: Partial<Goal>) {
        const { data, error } = await db
            .from("goals")
            .update(updates)
            .eq("id", goalId)
            .eq("user_id", userId)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data as Goal;
    },

    async deleteGoal(userId: string, goalId: string) {
        const { error } = await db.from("goals").delete().eq("id", goalId).eq("user_id", userId);

        if (error) throw new Error(error.message);
        return true;
    },
};
