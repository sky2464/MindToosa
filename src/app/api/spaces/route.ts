import { auth } from "@/auth";
import { db } from "@/server/db";
import { SpaceSchema } from "@/core/planTypes";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  const userId = session?.user?.email;
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { data, error } = await db
    .from("spaces")
    .select("*")
    .eq("user_id", userId)
    .eq("archived", false);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.email;
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const json = await req.json();
    const body = SpaceSchema.safeParse(json);

    if (!body.success) {
      return NextResponse.json({ error: body.error }, { status: 400 });
    }

    const { data, error } = await db
      .from("spaces")
      .insert({ ...body.data, user_id: userId })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
