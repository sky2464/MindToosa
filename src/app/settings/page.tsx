import { auth } from "@auth";
import { redirect } from "next/navigation";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
    const session = await auth();
    if (!session?.user?.email) redirect("/api/auth/signin");

    return <SettingsClient userEmail={session.user.email} />;
}
