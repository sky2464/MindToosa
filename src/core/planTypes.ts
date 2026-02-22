import { z } from "zod";

// primitives
export const MicroStepSchema = z.string().min(1);

export const SpaceSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().optional(), // Often inferred from context
  name: z.string().min(1),
  created_at: z.date().optional(),
  archived: z.boolean().default(false),
});

export const GoalSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().optional(),
  space_id: z.string().uuid(),
  title: z.string().min(1),
  horizon: z.enum(["week", "month", "year", "life"]).optional(), // Simplified horizon
  why: z.string().optional(),
  created_at: z.date().optional(),
  archived: z.boolean().default(false),
});

export const ProjectSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().optional(),
  space_id: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional(),
  scope: z.string().optional(),
  status: z.enum(["active", "completed", "on_hold"]).default("active"),
  due_date: z.string().date().optional(), // YYYY-MM-DD
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export const TaskStatusSchema = z.enum(["todo", "in_progress", "done", "migrated", "cancelled"]);
export const TaskPrioritySchema = z.enum(["must_do", "optional", "normal"]);

export const TaskSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().optional(),
  space_id: z.string().uuid(),
  goal_id: z.string().uuid().optional().nullable(),
  project_id: z.string().uuid().optional().nullable(),
  parent_task_id: z.string().uuid().optional().nullable(),
  title: z.string().min(1),
  priority: TaskPrioritySchema.default("normal"),
  estimated_minutes: z.number().int().min(1).default(25),
  scheduled_for: z.string().date().optional(), // YYYY-MM-DD
  status: TaskStatusSchema.default("todo"),
  micro_steps: z.array(MicroStepSchema).default([]),
  recurrence_rule: z.string().optional(), // RFC 5545
  parent_recurring_task_id: z.string().uuid().optional().nullable(),
  series_id: z.string().uuid().optional().nullable(),
  position: z.number().int().default(0).optional(),
  soft_deleted_at: z.string().optional().nullable(),
  created_at: z.date().optional(),
});

export const FocusSessionSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().optional(),
  task_id: z.string().uuid().optional().nullable(),
  started_at: z.date(),
  duration_minutes: z.number().int().min(1),
  completed: z.boolean().default(false),
});

export const TaskLabelSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().optional(),
  name: z.string().min(1),
  color: z.string().default("#6366f1"),
  created_at: z.date().optional(),
});

export const TaskCommentSchema = z.object({
  id: z.string().uuid().optional(),
  task_id: z.string().uuid(),
  user_id: z.string().optional(),
  content: z.string().min(1),
  created_at: z.date().optional(),
});

// Planning Objects (Input/Output for AI or API)
export const DailyPlanSchema = z.object({
  date: z.string().date(), // YYYY-MM-DD
  mustDo: z.array(TaskSchema).max(3),
  optional: z.array(TaskSchema).max(4),
  constraints: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export type Space = z.infer<typeof SpaceSchema>;
export type Goal = z.infer<typeof GoalSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type Task = z.infer<typeof TaskSchema>;
export type FocusSession = z.infer<typeof FocusSessionSchema>;
export type DailyPlan = z.infer<typeof DailyPlanSchema>;
export type TaskLabel = z.infer<typeof TaskLabelSchema>;
export type TaskComment = z.infer<typeof TaskCommentSchema>;
