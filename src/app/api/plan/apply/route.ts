import { auth } from "@/auth"
// import { db } from "@/server/db"
import { DailyPlanSchema } from "@/core/planTypes"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
    const session = await auth()
    const userId = session?.user?.email
    if (!userId) return new NextResponse("Unauthorized", { status: 401 })

    try {
        const json = await req.json()
        const result = DailyPlanSchema.safeParse(json)

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 400 })
        }

        const { mustDo, optional } = result.data
        const allTasks = [...mustDo, ...optional]

        // Insert all tasks
        // In real app: use transaction or Promise.all
        // We need to ensure space_id is valid.

        // For MVP, just return success if valid
        return NextResponse.json({ applied: true, taskCount: allTasks.length })

    } catch {
        return NextResponse.json({ error: "Internal Error" }, { status: 500 })
    }
}
