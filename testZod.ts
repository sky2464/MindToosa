import { z } from "zod";

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

const result = ProjectSchema.safeParse({
    user_id: "test",
    title: "test",
    description: "",
    scope: "",
    space_id: "00000000-0000-0000-0000-000000000000",
    status: "active"
});

console.log(JSON.stringify(result, null, 2));
