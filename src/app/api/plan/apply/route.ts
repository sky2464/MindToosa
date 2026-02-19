import { auth } from "@auth";
import { taskService } from "@/server/services/taskService";
import { DailyPlanSchema } from "@/core/planTypes";
import { NextResponse } from "next/server";
import { z } from "zod";

/**
 * Enhanced validation schema for daily plan application
 * Adds security constraints on top of the base DailyPlanSchema
 */
const ApplyPlanSchema = DailyPlanSchema.extend({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  mustDo: z.array(z.any()).max(50, "Cannot schedule more than 50 must-do tasks per day"),
  optional: z.array(z.any()).max(50, "Cannot schedule more than 50 optional tasks per day"),
});

export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.email;
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const json = await req.json();
    const result = ApplyPlanSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: result.error.format()
        },
        { status: 400 }
      );
    }

    const { date, mustDo, optional } = result.data;

    // Validate date is not too far in the past or future
    const planDate = new Date(date);
    const today = new Date();
    const daysDiff = Math.abs((planDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff > 365) {
      return NextResponse.json(
        { error: "Date must be within one year of today" },
        { status: 400 }
      );
    }

    // 1. Prepare tasks for upsert
    // - Set scheduled_for to the plan date
    // - specific priority
    const mustDoTasks = mustDo.map((t) => ({
      ...t,
      priority: "must_do" as const, // Force priority
      scheduled_for: date,
      user_id: userId,
    }));

    const optionalTasks = optional.map((t) => ({
      ...t,
      priority: "optional" as const, // Force priority
      scheduled_for: date,
      user_id: userId,
    }));

    const allTasks = [...mustDoTasks, ...optionalTasks];

    // 2. Persist
    if (allTasks.length > 0) {
      await taskService.upsertTasks(userId, allTasks);
    }

    return NextResponse.json({ applied: true, taskCount: allTasks.length });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: message || "Internal Error" }, { status: 500 });
  }
}
