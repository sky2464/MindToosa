import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@auth";

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

    // TODO: Implement email sending (Resend, SendGrid, etc.)
    // For now, log to console in dev and return success
    if (process.env.NODE_ENV === "development") {
      console.log("📧 Support Message:", { email, subject, message });
    }

    return NextResponse.json(
      { success: true, message: "Your message has been received" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Support API error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
