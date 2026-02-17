import { auth } from "@/auth"
import { taskService } from "@/server/services/taskService"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
    const session = await auth()
    const userId = session?.user?.email
    if (!userId) {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const spaceId = searchParams.get("spaceId") || undefined
    const date = searchParams.get("date") || undefined

    try {
        const tasks = await taskService.getTasks(userId, { spaceId, date })
        return NextResponse.json(tasks)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(req: Request) {
    const session = await auth()
    const userId = session?.user?.email
    if (!userId) {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    try {
        const json = await req.json()
        const task = await taskService.createTask(userId, json)
        return NextResponse.json(task)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 })
    }
}
