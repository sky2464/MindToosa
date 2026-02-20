import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@auth";
import { db } from "@/server/db";
import { handleRouteError } from "@/lib/routeError";

const SupportSchema = z.object({
  email: z.string().email("Invalid email address"),
  subject: z.string().min(3, "Subject must be at least 3 characters").max(100),
  message: z.string().min(10, "Message must be at least 10 characters").max(5000),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = SupportSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { email, subject, message } = parsed.data;

    // Persist to DB — visible to admins, traceable by user
    const { error: dbError } = await db.from("support_requests").insert({
      user_id: session.user.email,
      email,
      subject,
      message,
    });

    if (dbError) throw new Error(dbError.message);

    return NextResponse.json(
      { success: true, message: "Your message has been received" },
      { status: 200 }
    );
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}
