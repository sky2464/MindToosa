import { auth } from "@/auth"
import { taskService } from "@/server/services/taskService"
import { NextResponse } from "next/server"

// Input: user context (optional)
// Output: DailyPlan JSON populated with real tasks
export async function POST() {
    const session = await auth()
    const userId = session?.user?.email
    if (!userId) {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    try {
        const today = new Date().toISOString().split("T")[0];

        // 1. Fetch existing tasks scheduled for today
        const tasks = await taskService.getTasks(userId, { date: today });

        // 2. Segregate by priority
        const mustDo = tasks.filter(t => t.priority === 'must_do' && t.status !== 'done');
        const optional = tasks.filter(t => t.priority !== 'must_do' && t.status !== 'done');

        // 3. Construct DailyPlan
        const plan = {
            date: today,
            mustDo,
            optional,
            notes: "Plan generated from existing tasks."
        };

        return NextResponse.json(plan);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
