import { auth } from "@/auth"
import { db } from "@/server/db"
import { SpaceSchema } from "@/core/planTypes"
import { NextResponse } from "next/server"

export async function GET() {
    const session = await auth()
    if (!session?.user?.email) {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    // Assuming user_id is the email for MVP, or sub if available. 
    // Ideally we use a consistent ID. 
    const userId = session.user.email

    const { data, error } = await db
        .from("spaces")
        .select("*")
        .eq("user_id", userId)
        .eq("archived", false)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
}

export async function POST(req: Request) {
    const session = await auth()
    if (!session?.user?.email) {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    const userId = session.user.email

    try {
        const json = await req.json()
        const body = SpaceSchema.safeParse(json)

        if (!body.success) {
            return NextResponse.json({ error: body.error }, { status: 400 })
        }

        const { data, error } = await db
            .from("spaces")
            .insert({ ...body.data, user_id: userId })
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
