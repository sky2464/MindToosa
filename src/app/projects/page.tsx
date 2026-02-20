import { auth } from "@auth";
import { projectService } from "@/server/services/projectService";
import { spaceService } from "@/server/services/spaceService";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FolderPlus, ArrowRight } from "lucide-react";
import NewProjectForm from "./NewProjectForm";
import ProjectProgress from "@/components/ProjectProgress";

export default async function ProjectsPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/api/auth/signin");

  const userId = session.user.email;
  const projects = await projectService.getProjects(userId);
  const defaultSpace = await spaceService.ensureDefaultSpace(userId);

  // Fetch tasks for all projects in parallel for progress tracking
  const projectTasks = await Promise.all(
    projects.map((p) => projectService.getProjectTasks(userId, p.id!))
  );

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-4 sm:p-6 lg:p-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Projects</h1>
          <p className="mt-1 text-muted-foreground">Manage your big goals and tasks.</p>
        </div>
        <Link href="/today" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
          &larr; Back to Today
        </Link>
      </header>

      {/* Project List */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project, i) => (
          <div
            key={project.id}
            className="glass-card group relative rounded-xl p-5 transition-all hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/5"
          >
            <Link href={`/projects/${project.id}`} className="absolute inset-0 z-0">
              <span className="sr-only">View project</span>
            </Link>
            <div className="relative z-10 flex items-start justify-between">
              <h3 className="line-clamp-1 text-lg font-semibold text-foreground group-hover:text-primary">
                {project.title}
              </h3>
            </div>
            <p className="mt-2 line-clamp-2 min-h-[40px] text-sm text-muted-foreground">
              {project.description || "No description provided."}
            </p>

            {/* Progress tracking */}
            <div className="relative z-10">
              <ProjectProgress tasks={projectTasks[i] ?? []} />
            </div>

            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
              <span>{project.created_at ? new Date(project.created_at).toLocaleDateString() : ""}</span>
              <span
                className={`rounded-full px-2 py-1 ${project.status === "active"
                  ? "bg-green-500/10 text-green-400"
                  : project.status === "completed"
                    ? "bg-indigo-500/10 text-indigo-400"
                    : "bg-zinc-800 text-zinc-400"
                  }`}
              >
                {project.status.replace("_", " ")}
              </span>
            </div>
          </div>
        ))}

        {/* Create New Card */}
        <NewProjectForm spaceId={defaultSpace?.id ?? ""} />
      </div>
    </div>
  );
}
