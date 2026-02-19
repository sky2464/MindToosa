import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { taskService } from "@/server/services/taskService";
import { recurrenceService } from "@/server/services/recurrenceService";
import { handleRouteError } from "@/lib/routeError";

/**
 * Vercel Cron: runs daily to spawn recurring task instances for today.
 * Triggered via vercel.json cron schedule.
 * Protected by CRON_SECRET header set in vercel.json env.
 */
export async function GET(req: Request) {
  // Verify the request is from Vercel Cron (or authorized caller)
  const authHeader = req.headers.get("Authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const today = new Date().toISOString().split("T")[0];
    const todayDate = new Date(today);

    // Fetch all active recurring tasks that haven't already spawned for today
    // A recurring task is one with recurrence_rule set and status != done/cancelled
    const { data: recurringTasks, error } = await db
      .from("tasks")
      .select("*")
      .not("recurrence_rule", "is", null)
      .not("status", "in", '("done","cancelled","migrated")')
      .is("soft_deleted_at", null);

    if (error) throw new Error(error.message);

    let spawned = 0;

    for (const task of recurringTasks ?? []) {
      if (!task.recurrence_rule) continue;

      const lastDate = task.scheduled_for ? new Date(task.scheduled_for) : new Date();
      const nextDate = recurrenceService.getNextDueDate(task.recurrence_rule, lastDate);

      if (!nextDate) continue;
      const nextDateStr = nextDate.toISOString().split("T")[0];

      // Only spawn if next date is today
      if (nextDateStr !== today) continue;

      // Check that an instance for today doesn't already exist
      const { count } = await db
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .eq("user_id", task.user_id)
        .eq("parent_recurring_task_id", task.parent_recurring_task_id || task.id)
        .eq("scheduled_for", today);

      if ((count ?? 0) > 0) continue;

      await taskService.createTask(task.user_id, {
        title: task.title,
        space_id: task.space_id,
        project_id: task.project_id,
        goal_id: task.goal_id,
        priority: task.priority,
        estimated_minutes: task.estimated_minutes,
        micro_steps: task.micro_steps,
        recurrence_rule: task.recurrence_rule,
        parent_recurring_task_id: task.parent_recurring_task_id || task.id,
        scheduled_for: nextDateStr,
        status: "todo",
      });

      spawned++;
    }

    return NextResponse.json({ ok: true, today, spawned });
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}
