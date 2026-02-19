"use server";

import { projectService } from "@/server/services/projectService";
import { revalidatePath } from "next/cache";
import { auth } from "@auth";
import { z } from "zod";
import { llmClient } from "@/server/llmClient";

const CreateProjectSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  spaceId: z.string().uuid(),
});

async function getAuthUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");
  return session.user.email;
}

export async function createProjectAction(formData: FormData) {
  const userId = await getAuthUserId();

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const spaceId = formData.get("spaceId") as string;

  if (!title || !spaceId) {
    throw new Error("Missing required fields");
  }

  await projectService.createProject(userId, {
    title,
    description,
    space_id: spaceId,
    status: "active",
  });

  revalidatePath("/projects");
}

export async function deleteProjectAction(id: string) {
  const userId = await getAuthUserId();
  await projectService.deleteProject(userId, id);
  revalidatePath("/projects");
}

export async function chatWithProjectAction(projectId: string, message: string) {
  const userId = await getAuthUserId();

  const project = await projectService.getProjectById(userId, projectId);
  const tasks = await projectService.getProjectTasks(userId, projectId);

  if (!project) throw new Error("Project not found");

  return await llmClient.chatWithProject({ project, tasks }, message);
}

export async function suggestSubtasksAction(taskTitle: string) {
  await getAuthUserId(); // Verify auth
  return await llmClient.suggestSubtasks(taskTitle);
}
