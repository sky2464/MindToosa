import { z } from "zod";

// primitives
export const MicroStepSchema = z.string().min(1);

export const SpaceSchema = z.object({
    id: z.string().uuid().optional(),
    user_id: z.string().uuid().optional(), // Often inferred from context
    name: z.string().min(1),
    created_at: z.date().optional(),
    archived: z.boolean().default(false),
});

export const GoalSchema = z.object({
    id: z.string().uuid().optional(),
    user_id: z.string().uuid().optional(),
    space_id: z.string().uuid(),
    title: z.string().min(1),
    horizon: z.enum(["week", "month", "year", "life"]).optional(), // Simplified horizon
    why: z.string().optional(),
    created_at: z.date().optional(),
    archived: z.boolean().default(false),
});

export const TaskStatusSchema = z.enum(["todo", "in_progress", "done", "migrated", "cancelled"]);
export const TaskPrioritySchema = z.enum(["must_do", "optional", "normal"]);

export const TaskSchema = z.object({
    id: z.string().uuid().optional(),
    user_id: z.string().uuid().optional(),
    space_id: z.string().uuid(),
    goal_id: z.string().uuid().optional().nullable(),
    title: z.string().min(1),
    priority: TaskPrioritySchema.default("normal"),
    estimated_minutes: z.number().int().min(1).default(25),
    scheduled_for: z.string().date().optional(), // YYYY-MM-DD
    status: TaskStatusSchema.default("todo"),
    micro_steps: z.array(MicroStepSchema).default([]),
    created_at: z.date().optional(),
});

export const FocusSessionSchema = z.object({
    id: z.string().uuid().optional(),
    user_id: z.string().uuid().optional(),
    task_id: z.string().uuid().optional().nullable(),
    started_at: z.date(),
    duration_minutes: z.number().int().min(1),
    completed: z.boolean().default(false),
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
export type Task = z.infer<typeof TaskSchema>;
export type FocusSession = z.infer<typeof FocusSessionSchema>;
export type DailyPlan = z.infer<typeof DailyPlanSchema>;
