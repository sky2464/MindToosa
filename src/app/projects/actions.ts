"use server";

import { projectService } from "@/server/services/projectService";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const CreateProjectSchema = z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    spaceId: z.string().uuid(),
});

export async function createProjectAction(formData: FormData) {
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const spaceId = formData.get("spaceId") as string;

    if (!title || !spaceId) {
        throw new Error("Missing required fields");
    }

    await projectService.createProject({
        title,
        description,
        space_id: spaceId,
        status: "active",
    });

    revalidatePath("/projects");
}

export async function deleteProjectAction(id: string) {
    await projectService.deleteProject(id);
    revalidatePath("/projects");
}

import { llmClient } from "@/server/llmClient";
import { auth } from "@/auth";

export async function chatWithProjectAction(projectId: string, message: string) {
    const session = await auth();
    if (!session?.user?.email) throw new Error("Unauthorized");

    // We fetch fresh context here to ensure AI has latest state
    // Optimization: Pass context from client if we trust it, but server-side fetch is safer/cleaner
    const project = await projectService.getProjectById(projectId);
    const tasks = await projectService.getProjectTasks(projectId);

    if (!project) throw new Error("Project not found");

    return await llmClient.chatWithProject({ project, tasks }, message);
}

export async function suggestSubtasksAction(taskTitle: string) {
    const session = await auth();
    if (!session?.user?.email) throw new Error("Unauthorized");
    return await llmClient.suggestSubtasks(taskTitle);
}
