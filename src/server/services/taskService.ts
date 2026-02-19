import { db } from "@/server/db";
import { Task, TaskSchema } from "@/core/planTypes";
import { z } from "zod";
import { AppError, ValidationError, AuthError } from "@/lib/errors";

const UUIDSchema = z.string().uuid("Invalid UUID format");
const UUIDOptionalSchema = z.string().uuid("Invalid UUID format").optional();

export const taskService = {
  async getTasks(
    userId: string,
    options: { spaceId?: string; date?: string; dateFrom?: string; dateTo?: string; projectId?: string; parentId?: string; limit?: number; offset?: number } = {}
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

    if (options.parentId) {
      if (!UUIDSchema.safeParse(options.parentId).success) throw new ValidationError("Invalid parent task ID");
      query = query.eq("parent_task_id", options.parentId);
    }

    // Exclude soft-deleted tasks from normal queries
    query = query.is("soft_deleted_at", null);

    const limit = Math.min(options.limit ?? 200, 200);
    const offset = options.offset ?? 0;
    query = query.order("position", { ascending: true }).range(offset, offset + limit - 1);

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
    // Soft delete: set soft_deleted_at instead of removing the row
    const { error } = await db
      .from("tasks")
      .update({ soft_deleted_at: new Date().toISOString() })
      .eq("id", taskId)
      .eq("user_id", userId);

    if (error) throw new AppError(error.message, "DB_ERROR");
    return true;
  },

  async getDeletedTasks(userId: string): Promise<Task[]> {
    const { data, error } = await db
      .from("tasks")
      .select("*")
      .eq("user_id", userId)
      .not("soft_deleted_at", "is", null)
      .order("soft_deleted_at", { ascending: false });

    if (error) throw new AppError(error.message, "DB_ERROR");
    return data as Task[];
  },

  async restoreTask(userId: string, taskId: string) {
    if (!UUIDSchema.safeParse(taskId).success) throw new ValidationError("Invalid task ID");
    const { error } = await db
      .from("tasks")
      .update({ soft_deleted_at: null })
      .eq("id", taskId)
      .eq("user_id", userId);

    if (error) throw new AppError(error.message, "DB_ERROR");
    return true;
  },

  async permanentlyDeleteTask(userId: string, taskId: string) {
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

    // 1. Fetch current task to verify ownership AND check for recurrence
    const { data: currentTask, error: fetchError } = await db
      .from("tasks")
      .select("*")
      .eq("id", taskId)
      .eq("user_id", userId) // CRITICAL: Enforce ownership here
      .single();

    if (fetchError || !currentTask) {
      // If not found or not owned, return null or throw error. 
      // Standard practice: if not found, it might be auth or existing.
      // We'll throw AuthError to be safe or AppError.
      throw new AuthError("Task not found or access denied");
    }

    // Check dependencies if completing
    if (updates.status === "done") {
      const { data: blockers } = await db
        .from("task_dependencies")
        .select(`
                blocking_task:tasks!task_dependencies_blocking_task_id_fkey (
                    status
                )
            `)
        .eq("task_id", taskId);

      const hasOpenBlockers = blockers?.some((d: any) => d.blocking_task?.status !== "done");
      if (hasOpenBlockers) {
        throw new ValidationError("Cannot complete task: Waiting on dependencies.");
      }
    }

    // 2. Check for recurrence completion — use atomic RPC to prevent ghost tasks
    if (updates.status === "done" && currentTask.recurrence_rule) {
      const { recurrenceService } = await import("./recurrenceService");
      const lastDate = currentTask.scheduled_for ? new Date(currentTask.scheduled_for) : new Date();
      const nextDate = recurrenceService.getNextDueDate(currentTask.recurrence_rule, lastDate);

      if (nextDate) {
        const nextDateStr = nextDate.toISOString().split("T")[0];

        const { error: rpcError } = await db.rpc("complete_and_spawn", {
          p_task_id: taskId,
          p_user_id: userId,
          p_next_title: currentTask.title,
          p_next_date: nextDateStr,
          p_space_id: currentTask.space_id,
          p_project_id: currentTask.project_id ?? null,
          p_goal_id: currentTask.goal_id ?? null,
          p_priority: currentTask.priority ?? null,
          p_estimated_minutes: currentTask.estimated_minutes ?? null,
          p_micro_steps: currentTask.micro_steps ?? null,
          p_recurrence_rule: currentTask.recurrence_rule,
        });

        if (rpcError) throw new AppError(rpcError.message, "DB_ERROR");

        // RPC already marked the task done — return the updated task
        const { data: refreshed } = await db.from("tasks").select("*").eq("id", taskId).single();
        return refreshed as Task;
      }
    }

    // 3. Perform the update
    const { data, error } = await db
      .from("tasks")
      .update(updates)
      .eq("id", taskId)
      .eq("user_id", userId) // Redundant but safe
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

  // Dependencies
  async getDependencies(userId: string, taskId: string) {
    if (!UUIDSchema.safeParse(taskId).success) throw new ValidationError("Invalid task ID");
    // Get tasks that block this task
    const { data, error } = await db
      .from("task_dependencies")
      .select(`
        blocking_task_id,
        blocking_task:tasks!task_dependencies_blocking_task_id_fkey (*)
      `)
      .eq("task_id", taskId);

    if (error) throw new AppError(error.message, "DB_ERROR");
    // Flatten result
    return data.map((d: any) => d.blocking_task) as Task[];
  },

  async addDependency(userId: string, taskId: string, blockingTaskId: string) {
    if (!UUIDSchema.safeParse(taskId).success) throw new ValidationError("Invalid task ID");
    if (!UUIDSchema.safeParse(blockingTaskId).success) throw new ValidationError("Invalid blocking task ID");
    if (taskId === blockingTaskId) throw new ValidationError("Task cannot depend on itself");

    // Verify ownership of both
    const { count } = await db
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .in("id", [taskId, blockingTaskId])
      .eq("user_id", userId);

    if (count !== 2) throw new AuthError("Tasks not found or access denied");

    // Check for circular dependency (simple 1-level check for now, handling deep cycles requires recursive CTEs or app logic)
    // For MVP, just preventing direct cycle
    const { data: reverse } = await db.from("task_dependencies").select("*").eq("task_id", blockingTaskId).eq("blocking_task_id", taskId).single();
    if (reverse) throw new ValidationError("Circular dependency detected");

    const { data, error } = await db
      .from("task_dependencies")
      .insert({ task_id: taskId, blocking_task_id: blockingTaskId })
      .select()
      .single();

    if (error) throw new AppError(error.message, "DB_ERROR");
    return data;
  },

  async removeDependency(userId: string, taskId: string, blockingTaskId: string) {
    if (!UUIDSchema.safeParse(taskId).success) throw new ValidationError("Invalid task ID");
    if (!UUIDSchema.safeParse(blockingTaskId).success) throw new ValidationError("Invalid blocking task ID");

    // Verify ownership of both tasks before deleting (service-role key bypasses RLS)
    const { count } = await db
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .in("id", [taskId, blockingTaskId])
      .eq("user_id", userId);

    if (count !== 2) throw new AuthError("Tasks not found or access denied");

    const { error } = await db
      .from("task_dependencies")
      .delete()
      .eq("task_id", taskId)
      .eq("blocking_task_id", blockingTaskId);

    if (error) throw new AppError(error.message, "DB_ERROR");
    return true;
  },
};
