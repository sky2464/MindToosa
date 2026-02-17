import { auth } from "@/auth"
import { taskService } from "@/server/services/taskService"
import { DailyPlanSchema } from "@/core/planTypes"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
    const session = await auth()
    const userId = session?.user?.email
    if (!userId) {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    try {
        const json = await req.json()
        const result = DailyPlanSchema.safeParse(json)

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 400 })
        }

        const { date, mustDo, optional } = result.data

        // 1. Prepare tasks for upsert
        // - Set scheduled_for to the plan date
        // - specific priority
        const mustDoTasks = mustDo.map(t => ({
            ...t,
            priority: "must_do" as const, // Force priority
            scheduled_for: date,
            user_id: userId
        }));

        const optionalTasks = optional.map(t => ({
            ...t,
            priority: "optional" as const, // Force priority
            scheduled_for: date,
            user_id: userId
        }));

        const allTasks = [...mustDoTasks, ...optionalTasks];

        // 2. Persist
        if (allTasks.length > 0) {
            await taskService.upsertTasks(userId, allTasks);
        }

        return NextResponse.json({ applied: true, taskCount: allTasks.length })

    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Internal Error" }, { status: 500 })
    }
}
