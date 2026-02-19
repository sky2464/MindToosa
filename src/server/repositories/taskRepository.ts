/**
 * Supabase implementation of ITaskRepository.
 * Demonstrates the repository pattern — services can accept ITaskRepository
 * and be tested with a mock without requiring a live DB connection.
 */

import { db } from "@/server/db";
import { Task, TaskSchema } from "@/core/planTypes";
import { AppError, ValidationError } from "@/lib/errors";
import { z } from "zod";
import type { ITaskRepository, TaskFilters } from "./interfaces";

const UUIDSchema = z.string().uuid();

export class SupabaseTaskRepository implements ITaskRepository {
  async findMany(userId: string, filters: TaskFilters = {}): Promise<Task[]> {
    let query = db
      .from("tasks")
      .select("*")
      .eq("user_id", userId)
      .is("soft_deleted_at", null);

    if (filters.spaceId) query = query.eq("space_id", filters.spaceId);
    if (filters.date) query = query.eq("scheduled_for", filters.date);
    if (filters.dateFrom) query = query.gte("scheduled_for", filters.dateFrom);
    if (filters.dateTo) query = query.lte("scheduled_for", filters.dateTo);
    if (filters.projectId) query = query.eq("project_id", filters.projectId);
    if (filters.parentId) query = query.eq("parent_task_id", filters.parentId);

    const limit = Math.min(filters.limit ?? 200, 200);
    const offset = filters.offset ?? 0;
    query = query.order("position", { ascending: true }).range(offset, offset + limit - 1);

    const { data, error } = await query;
    if (error) throw new AppError(error.message, "DB_ERROR");
    return data as Task[];
  }

  async findById(userId: string, taskId: string): Promise<Task | null> {
    const { data, error } = await db
      .from("tasks")
      .select("*")
      .eq("id", taskId)
      .eq("user_id", userId)
      .single();
    if (error) return null;
    return data as Task;
  }

  async create(userId: string, data: Partial<Task>): Promise<Task> {
    const payload = { ...data, user_id: userId };
    const validation = TaskSchema.safeParse(payload);
    if (!validation.success) {
      throw new ValidationError("Validation failed", undefined, validation.error.format());
    }
    const { data: row, error } = await db
      .from("tasks")
      .insert(validation.data)
      .select()
      .single();
    if (error) throw new AppError(error.message, "DB_ERROR");
    return row as Task;
  }

  async update(userId: string, taskId: string, data: Partial<Task>): Promise<Task> {
    if (!UUIDSchema.safeParse(taskId).success) throw new ValidationError("Invalid task ID");
    const { data: row, error } = await db
      .from("tasks")
      .update(data)
      .eq("id", taskId)
      .eq("user_id", userId)
      .select()
      .single();
    if (error) throw new AppError(error.message, "DB_ERROR");
    return row as Task;
  }

  async softDelete(userId: string, taskId: string): Promise<void> {
    if (!UUIDSchema.safeParse(taskId).success) throw new ValidationError("Invalid task ID");
    const { error } = await db
      .from("tasks")
      .update({ soft_deleted_at: new Date().toISOString() })
      .eq("id", taskId)
      .eq("user_id", userId);
    if (error) throw new AppError(error.message, "DB_ERROR");
  }

  async restore(userId: string, taskId: string): Promise<void> {
    if (!UUIDSchema.safeParse(taskId).success) throw new ValidationError("Invalid task ID");
    const { error } = await db
      .from("tasks")
      .update({ soft_deleted_at: null })
      .eq("id", taskId)
      .eq("user_id", userId);
    if (error) throw new AppError(error.message, "DB_ERROR");
  }

  async permanentDelete(userId: string, taskId: string): Promise<void> {
    if (!UUIDSchema.safeParse(taskId).success) throw new ValidationError("Invalid task ID");
    const { error } = await db
      .from("tasks")
      .delete()
      .eq("id", taskId)
      .eq("user_id", userId);
    if (error) throw new AppError(error.message, "DB_ERROR");
  }

  async findDeleted(userId: string): Promise<Task[]> {
    const { data, error } = await db
      .from("tasks")
      .select("*")
      .eq("user_id", userId)
      .not("soft_deleted_at", "is", null)
      .order("soft_deleted_at", { ascending: false });
    if (error) throw new AppError(error.message, "DB_ERROR");
    return data as Task[];
  }
}

/** Default singleton for production use */
export const taskRepository = new SupabaseTaskRepository();
