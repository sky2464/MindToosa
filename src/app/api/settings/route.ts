import { auth } from "@auth";
import { userService, UserSettingsSchema } from "@/server/services/userService";
import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/routeError";
import { jsonEnvelope } from "@/lib/apiEnvelope";

const SettingsPatchSchema = UserSettingsSchema
    .omit({ user_id: true })
    .partial();

export async function GET() {
    const session = await auth();
    const userId = session?.user?.email;
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    try {
        const settings = await userService.getSettings(userId);
        return jsonEnvelope(settings);
    } catch (error: unknown) {
        return handleRouteError(error);
    }
}

export async function PATCH(req: Request) {
    const session = await auth();
    const userId = session?.user?.email;
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    try {
        const json = await req.json();
        const parsed = SettingsPatchSchema.safeParse(json);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Validation failed", details: parsed.error.flatten() },
                { status: 400 }
            );
        }
        const settings = await userService.updateSettings(userId, parsed.data);
        return jsonEnvelope(settings);
    } catch (error: unknown) {
        return handleRouteError(error);
    }
}
