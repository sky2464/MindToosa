import { db } from "@/server/db";
import { Goal, GoalSchema } from "@/core/planTypes";
import { z } from "zod";
import { AppError, ValidationError } from "@/lib/errors";

/**
 * UUID validation schema
 */
const UUIDSchema = z.string().uuid("Invalid UUID format");

/**
 * Schema for allowed goal update fields
 * Only specific fields can be updated to prevent arbitrary modifications
 */
const GoalUpdateSchema = z.object({
    title: z.string().optional(),
    horizon: z.string().optional(),
    why: z.string().optional(),
    archived: z.boolean().optional(),
    space_id: z.string().uuid().optional(),
}).strict(); // Reject any fields not in this schema

export const goalService = {
    async getGoals(userId: string, options: { archived?: boolean; spaceId?: string } = {}) {
        let query = db.from("goals").select("*").eq("user_id", userId);

        if (options.archived !== undefined) {
            query = query.eq("archived", options.archived);
        }

        if (options.spaceId) {
            // Validate spaceId is a valid UUID
            const validation = UUIDSchema.safeParse(options.spaceId);
            if (!validation.success) {
                throw new ValidationError("Invalid space ID format", "spaceId");
            }
            query = query.eq("space_id", options.spaceId);
        }

        const { data, error } = await query.order("created_at", { ascending: false });

        if (error) throw new AppError(error.message, "DB_ERROR");
        return data as Goal[];
    },

    async createGoal(userId: string, goalData: Partial<Goal>) {
        const payload = { ...goalData, user_id: userId };
        const validation = GoalSchema.safeParse(payload);

        if (!validation.success) {
            throw new ValidationError("Validation failed", undefined, validation.error.format());
        }

        const { data, error } = await db.from("goals").insert(validation.data).select().single();

        if (error) throw new AppError(error.message, "DB_ERROR");
        return data as Goal;
    },

    async updateGoal(userId: string, goalId: string, updates: Partial<Goal>) {
        // Validate goalId is a valid UUID
        const idValidation = UUIDSchema.safeParse(goalId);
        if (!idValidation.success) {
            throw new ValidationError("Invalid goal ID format", "goalId");
        }

        // Validate and sanitize updates to only allow specific fields
        const updateValidation = GoalUpdateSchema.safeParse(updates);
        if (!updateValidation.success) {
            throw new ValidationError("Invalid update fields", undefined, updateValidation.error.format());
        }

        const { data, error } = await db
            .from("goals")
            .update(updateValidation.data)
            .eq("id", goalId)
            .eq("user_id", userId)
            .select()
            .single();

        if (error) throw new AppError(error.message, "DB_ERROR");
        return data as Goal;
    },

    async deleteGoal(userId: string, goalId: string) {
        // Validate goalId is a valid UUID
        const idValidation = UUIDSchema.safeParse(goalId);
        if (!idValidation.success) {
            throw new ValidationError("Invalid goal ID format", "goalId");
        }

        const { error } = await db.from("goals").delete().eq("id", goalId).eq("user_id", userId);

        if (error) throw new AppError(error.message, "DB_ERROR");
        return true;
    },
};
