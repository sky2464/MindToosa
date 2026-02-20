import { db } from "@/server/db";
import { Project, ProjectSchema, Task } from "@/core/planTypes";
import { AppError, ValidationError } from "@/lib/errors";
import { z } from "zod";

const UUIDSchema = z.string().uuid("Invalid UUID format");

export const projectService = {
  async getProjects(userId: string): Promise<Project[]> {
    const { data, error } = await db
      .from("projects")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw new AppError(error.message, "DB_ERROR");
    return data as Project[];
  },

  async getProjectById(userId: string, id: string): Promise<Project | null> {
    if (!UUIDSchema.safeParse(id).success) throw new ValidationError("Invalid project ID");
    const { data, error } = await db
      .from("projects")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (error) return null;
    return data as Project;
  },

  async createProject(userId: string, project: Partial<Project>) {
    const newProject = {
      ...project,
      user_id: userId,
    };

    const validation = ProjectSchema.safeParse(newProject);
    if (!validation.success) {
      throw new ValidationError("Validation failed", undefined, validation.error.format());
    }

    const { data, error } = await db.from("projects").insert(validation.data).select().single();

    if (error) {
      throw new AppError(error.message, "DB_ERROR");
    }

    return data as Project;
  },

  async updateProject(userId: string, id: string, updates: Partial<Project>) {
    if (!UUIDSchema.safeParse(id).success) throw new ValidationError("Invalid project ID");
    const { error } = await db.from("projects").update(updates).eq("id", id).eq("user_id", userId);

    if (error) throw new AppError(error.message, "DB_ERROR");
  },

  async deleteProject(userId: string, id: string) {
    if (!UUIDSchema.safeParse(id).success) throw new ValidationError("Invalid project ID");
    const { error } = await db.from("projects").delete().eq("id", id).eq("user_id", userId);

    if (error) throw new AppError(error.message, "DB_ERROR");
  },

  async getProjectTasks(userId: string, projectId: string): Promise<Task[]> {
    if (!UUIDSchema.safeParse(projectId).success) throw new ValidationError("Invalid project ID");
    const { data, error } = await db
      .from("tasks")
      .select("*")
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) throw new AppError(error.message, "DB_ERROR");
    return data as Task[];
  },
};
