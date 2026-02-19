import { db } from "@/server/db";
import { TaskLabel } from "@/core/planTypes";

export const labelService = {
    async getLabels(userId: string): Promise<TaskLabel[]> {
        const { data, error } = await db
            .from("task_labels")
            .select("*")
            .eq("user_id", userId)
            .order("name", { ascending: true });

        if (error) throw new Error(error.message);
        return data as TaskLabel[];
    },

    async createLabel(userId: string, name: string, color: string = "#6366f1"): Promise<TaskLabel> {
        const { data, error } = await db
            .from("task_labels")
            .insert({ user_id: userId, name, color })
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data as TaskLabel;
    },

    async updateLabel(userId: string, labelId: string, updates: { name?: string; color?: string }) {
        const { data, error } = await db
            .from("task_labels")
            .update(updates)
            .eq("id", labelId)
            .eq("user_id", userId)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data as TaskLabel;
    },

    async deleteLabel(userId: string, labelId: string) {
        const { error } = await db
            .from("task_labels")
            .delete()
            .eq("id", labelId)
            .eq("user_id", userId);

        if (error) throw new Error(error.message);
        return true;
    },

    async getTaskLabels(userId: string, taskId: string): Promise<TaskLabel[]> {
        // Verify the task belongs to this user before fetching labels
        const { data: task, error: taskError } = await db
            .from("tasks")
            .select("id")
            .eq("id", taskId)
            .eq("user_id", userId)
            .single();

        if (taskError || !task) throw new Error("Task not found or access denied");

        const { data, error } = await db
            .from("task_label_assignments")
            .select("label_id, task_labels(*)")
            .eq("task_id", taskId);

        if (error) throw new Error(error.message);
        return (data ?? []).map((row: Record<string, unknown>) => row.task_labels as TaskLabel);
    },

    async assignLabel(userId: string, taskId: string, labelId: string) {
        // Verify the task belongs to this user
        const { data: task, error: taskError } = await db
            .from("tasks")
            .select("id")
            .eq("id", taskId)
            .eq("user_id", userId)
            .single();

        if (taskError || !task) throw new Error("Task not found or access denied");

        const { error } = await db
            .from("task_label_assignments")
            .upsert({ task_id: taskId, label_id: labelId });

        if (error) throw new Error(error.message);
        return true;
    },

    async unassignLabel(userId: string, taskId: string, labelId: string) {
        // Verify the task belongs to this user
        const { data: task, error: taskError } = await db
            .from("tasks")
            .select("id")
            .eq("id", taskId)
            .eq("user_id", userId)
            .single();

        if (taskError || !task) throw new Error("Task not found or access denied");

        const { error } = await db
            .from("task_label_assignments")
            .delete()
            .eq("task_id", taskId)
            .eq("label_id", labelId);

        if (error) throw new Error(error.message);
        return true;
    },
};
