import { db } from "@/server/db";
import { Project, ProjectSchema, Task } from "@/core/planTypes";

export const projectService = {
  async getProjects(userId: string): Promise<Project[]> {
    const { data, error } = await db
      .from("projects")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data as Project[];
  },

  async getProjectById(userId: string, id: string): Promise<Project | null> {
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
      throw new Error("Validation failed: " + JSON.stringify(validation.error.format()));
    }

    const { data, error } = await db.from("projects").insert(validation.data).select().single();

    if (error) {
      console.error("Error creating project:", error);
      throw error;
    }

    return data as Project;
  },

  async updateProject(userId: string, id: string, updates: Partial<Project>) {
    const { error } = await db.from("projects").update(updates).eq("id", id).eq("user_id", userId);

    if (error) throw error;
  },

  async deleteProject(userId: string, id: string) {
    const { error } = await db.from("projects").delete().eq("id", id).eq("user_id", userId);

    if (error) throw error;
  },

  async getProjectTasks(userId: string, projectId: string): Promise<Task[]> {
    const { data, error } = await db
      .from("tasks")
      .select("*")
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data as Task[];
  },
};
