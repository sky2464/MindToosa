import { db } from "@/server/db";
import { Task, TaskSchema } from "@/core/planTypes";

export const taskService = {
    async getTasks(userId: string, options: { spaceId?: string; date?: string } = {}) {
        let query = db.from("tasks").select("*").eq("user_id", userId);

        if (options.spaceId) {
            query = query.eq("space_id", options.spaceId);
        }

        if (options.date) {
            query = query.eq("scheduled_for", options.date);
        }

        const { data, error } = await query;
        if (error) throw new Error(error.message);
        return data as Task[];
    },

    async createTask(userId: string, taskData: Partial<Task>) {
        // Ensure user_id is set
        const payload = { ...taskData, user_id: userId };
        const validation = TaskSchema.safeParse(payload);

        if (!validation.success) {
            throw new Error("Validation failed: " + JSON.stringify(validation.error.format()));
        }

        const { data, error } = await db
            .from("tasks")
            .insert(validation.data)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data as Task;
    },

    async deleteTask(userId: string, taskId: string) {
        const { error } = await db
            .from("tasks")
            .delete()
            .eq("id", taskId)
            .eq("user_id", userId);

        if (error) throw new Error(error.message);
        return true;
    },

    async upsertTasks(userId: string, tasks: Partial<Task>[]) {
        if (tasks.length === 0) return [];

        const payload = tasks.map(t => ({
            ...t,
            user_id: userId
        }));

        // Validate all? Or trust the caller to have validated via Zod schemas?
        // Better to trust caller for bulk ops or validate roughly.

        const { data, error } = await db
            .from("tasks")
            .upsert(payload)
            .select();

        if (error) throw new Error(error.message);
        return data as Task[];
    },

    async updateTask(userId: string, taskId: string, updates: Partial<Task>) {
        const { data, error } = await db
            .from("tasks")
            .update(updates)
            .eq("id", taskId)
            .eq("user_id", userId)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data as Task;
    }
};
