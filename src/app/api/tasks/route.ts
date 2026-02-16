import { auth } from "@/auth"
import { db } from "@/server/db"
import { TaskSchema } from "@/core/planTypes"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
    const session = await auth()
    const userId = session?.user?.email
    if (!userId) {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const spaceId = searchParams.get("spaceId")
    const date = searchParams.get("date")

    let query = db.from("tasks").select("*").eq("user_id", userId)

    if (spaceId) query = query.eq("space_id", spaceId)
    if (date) query = query.eq("scheduled_for", date)

    const { data, error } = await query

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
}

export async function POST(req: Request) {
    const session = await auth()
    const userId = session?.user?.email
    if (!userId) {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    try {
        const json = await req.json()
        // Override user_id just in case
        const payload = { ...json, user_id: userId }
        const result = TaskSchema.safeParse(payload)

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 400 })
        }

        const { data, error } = await db
            .from("tasks")
            .insert(result.data)
            .select()
            .single()

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json(data)
    } catch {
        return NextResponse.json({ error: "Internal Error" }, { status: 500 })
    }
}
