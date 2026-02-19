import { db } from "@/server/db";
import { Task, TaskSchema } from "@/core/planTypes";
import { z } from "zod";
import { AppError, ValidationError, AuthError } from "@/lib/errors";

const UUIDSchema = z.string().uuid("Invalid UUID format");
const UUIDOptionalSchema = z.string().uuid("Invalid UUID format").optional();

export const taskService = {
  async getTasks(
    userId: string,
    options: { spaceId?: string; date?: string; dateFrom?: string; dateTo?: string; projectId?: string } = {}
  ) {
    let query = db.from("tasks").select("*").eq("user_id", userId);

    if (options.spaceId) {
      if (!UUIDSchema.safeParse(options.spaceId).success) throw new ValidationError("Invalid space ID");
      query = query.eq("space_id", options.spaceId);
    }

    if (options.date) {
      query = query.eq("scheduled_for", options.date);
    }

    if (options.dateFrom) {
      query = query.gte("scheduled_for", options.dateFrom);
    }

    if (options.dateTo) {
      query = query.lte("scheduled_for", options.dateTo);
    }

    if (options.projectId) {
      if (!UUIDSchema.safeParse(options.projectId).success) throw new ValidationError("Invalid project ID");
      query = query.eq("project_id", options.projectId);
    }

    const { data, error } = await query;
    if (error) throw new AppError(error.message, "DB_ERROR");
    return data as Task[];
  },

  async createTask(userId: string, taskData: Partial<Task>) {
    // Ensure user_id is set
    const payload = { ...taskData, user_id: userId };
    const validation = TaskSchema.safeParse(payload);

    if (!validation.success) {
      throw new ValidationError("Validation failed", undefined, validation.error.format());
    }

    const { data, error } = await db.from("tasks").insert(validation.data).select().single();

    if (error) throw new AppError(error.message, "DB_ERROR");
    return data as Task;
  },

  async deleteTask(userId: string, taskId: string) {
    if (!UUIDSchema.safeParse(taskId).success) throw new ValidationError("Invalid task ID");
    const { error } = await db.from("tasks").delete().eq("id", taskId).eq("user_id", userId);

    if (error) throw new AppError(error.message, "DB_ERROR");
    return true;
  },

  async upsertTasks(userId: string, tasks: Partial<Task>[]) {
    if (tasks.length === 0) return [];

    // Validate each task against a partial schema
    const UpsertTaskSchema = TaskSchema.partial().extend({
      title: z.string().min(1),
    });

    const validatedTasks = tasks.map((t) => {
      const result = UpsertTaskSchema.safeParse(t);
      if (!result.success) {
        throw new ValidationError(`Task validation failed: ${result.error.message}`, undefined, result.error.format());
      }
      return { ...result.data, user_id: userId };
    });

    const { data, error } = await db.from("tasks").upsert(validatedTasks).select();
    if (error) throw new AppError(error.message, "DB_ERROR");
    return data as Task[];
  },

  async updateTask(userId: string, taskId: string, updates: Partial<Task>) {
    if (!UUIDSchema.safeParse(taskId).success) throw new ValidationError("Invalid task ID");
    const { data, error } = await db
      .from("tasks")
      .update(updates)
      .eq("id", taskId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw new AppError(error.message, "DB_ERROR");
    return data as Task;
  },

  async getSubtasks(userId: string, parentTaskId: string): Promise<Task[]> {
    if (!UUIDSchema.safeParse(parentTaskId).success) throw new ValidationError("Invalid parent task ID");
    const { data, error } = await db
      .from("tasks")
      .select("*")
      .eq("user_id", userId)
      .eq("parent_task_id", parentTaskId)
      .order("created_at", { ascending: true });

    if (error) throw new AppError(error.message, "DB_ERROR");
    return data as Task[];
  },

  async getComments(userId: string, taskId: string) {
    if (!UUIDSchema.safeParse(taskId).success) throw new ValidationError("Invalid task ID");
    // Verify the task belongs to this user before fetching comments
    const { data: task, error: taskError } = await db
      .from("tasks")
      .select("id")
      .eq("id", taskId)
      .eq("user_id", userId)
      .single();

    if (taskError || !task) throw new AuthError("Task not found or access denied");

    const { data, error } = await db
      .from("task_comments")
      .select("*")
      .eq("task_id", taskId)
      .order("created_at", { ascending: true });

    if (error) throw new AppError(error.message, "DB_ERROR");
    return data;
  },

  async createComment(userId: string, taskId: string, content: string) {
    if (!UUIDSchema.safeParse(taskId).success) throw new ValidationError("Invalid task ID");
    const { data, error } = await db
      .from("task_comments")
      .insert({ user_id: userId, task_id: taskId, content })
      .select()
      .single();

    if (error) throw new AppError(error.message, "DB_ERROR");
    return data;
  },

  async deleteComment(userId: string, commentId: string) {
    if (!UUIDSchema.safeParse(commentId).success) throw new ValidationError("Invalid comment ID");
    const { error } = await db
      .from("task_comments")
      .delete()
      .eq("id", commentId)
      .eq("user_id", userId);

    if (error) throw new AppError(error.message, "DB_ERROR");
    return true;
  },
};
