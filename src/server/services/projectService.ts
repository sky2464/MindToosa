import { db } from "@/server/db";
import { Project, ProjectSchema, Task } from "@/core/planTypes";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export const projectService = {
  async getProjects(): Promise<Project[]> {
    const session = await auth();
    if (!session?.user?.email) return [];
    const userId = session.user.email;

    const { data, error } = await db
      .from("projects")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data as Project[];
  },

  async getProjectById(id: string): Promise<Project | null> {
    const session = await auth();
    if (!session?.user?.email) return null;
    const userId = session.user.email;

    const { data, error } = await db
      .from("projects")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId) // Ensure ownership
      .single();

    if (error) return null;
    return data as Project;
  },

  async createProject(project: Partial<Project>) {
    const session = await auth();
    if (!session?.user?.email) throw new Error("Unauthorized");
    const userId = session.user.email;

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

    revalidatePath("/projects");
    return data as Project;
  },

  async updateProject(id: string, updates: Partial<Project>) {
    const session = await auth();
    if (!session?.user?.email) throw new Error("Unauthorized");
    const userId = session.user.email;

    const { error } = await db.from("projects").update(updates).eq("id", id).eq("user_id", userId);

    if (error) throw error;
    revalidatePath("/projects");
    revalidatePath(`/projects/${id}`);
  },

  async deleteProject(id: string) {
    const session = await auth();
    if (!session?.user?.email) throw new Error("Unauthorized");
    const userId = session.user.email;

    const { error } = await db.from("projects").delete().eq("id", id).eq("user_id", userId);

    if (error) throw error;
    revalidatePath("/projects");
  },

  async getProjectTasks(projectId: string): Promise<Task[]> {
    const session = await auth();
    if (!session?.user?.email) throw new Error("Unauthorized");
    const userId = session.user.email;

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
