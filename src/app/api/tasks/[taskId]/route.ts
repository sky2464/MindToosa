import { auth } from "@/auth"
import { taskService } from "@/server/services/taskService"
import { NextResponse } from "next/server"
import { TaskSchema } from "@/core/planTypes"

export async function PATCH(
    req: Request,
    { params }: { params: { taskId: string } }
) {
    const session = await auth()
    const userId = session?.user?.email
    if (!userId) {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    try {
        const json = await req.json()
        const taskId = params.taskId;

        // Basic validation of updates (TaskSchema is for full object, we can use partial)
        // Ideally we validate 'status' is valid enum.

        const updatedTask = await taskService.updateTask(userId, taskId, json)
        return NextResponse.json(updatedTask)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 })
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: { taskId: string } }
) {
    const session = await auth()
    const userId = session?.user?.email
    if (!userId) {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    try {
        const taskId = params.taskId;
        await taskService.deleteTask(userId, taskId);
        return new NextResponse(null, { status: 204 })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 })
    }
}
