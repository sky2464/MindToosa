"use server";

import { taskService } from "@/server/services/taskService";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function handleTaskMove(taskId: string, newStatus: string) {
    const session = await auth();
    if (!session?.user?.email) throw new Error("Unauthorized");
    const userId = session.user.email;

    // Use specific enum values for status
    await taskService.updateTask(userId, taskId, { status: newStatus as any });
    // Revalidation happens on client optimism, but we can revalidate if needed
}

export async function handleTaskCreate(projectId: string, title: string, status: string, spaceId: string) {
    const session = await auth();
    if (!session?.user?.email) throw new Error("Unauthorized");
    const userId = session.user.email;

    const newTask = await taskService.createTask(userId, {
        title,
        status: status as any,
        project_id: projectId,
        space_id: spaceId,
        priority: "normal",
        estimated_minutes: 25
    });

    return newTask;
}
