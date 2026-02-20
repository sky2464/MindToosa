import { auth } from "@auth";
import { projectService } from "@/server/services/projectService";
import { notFound, redirect } from "next/navigation";
import KanbanBoard from "@/components/KanbanBoard";
import AIChat from "@/components/AIChat";
import Link from "next/link";
import GenerateProjectTasksButton from "./GenerateProjectTasksButton";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.email) redirect("/api/auth/signin");

  const { id } = await params;
  const userId = session.user.email;
  const project = await projectService.getProjectById(userId, id);

  if (!project) notFound();

  const tasks = await projectService.getProjectTasks(userId, id);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* Header */}
      <header className="z-10 flex shrink-0 items-center justify-between border-b border-border bg-card px-6 py-4 shadow-sm shadow-black/20">
        <div className="flex items-center gap-4">
          <Link href="/projects" className="text-muted-foreground transition-colors hover:text-foreground">
            &larr; Projects
          </Link>
          <h1 className="text-xl font-bold text-foreground">{project.title}</h1>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${project.status === "active"
              ? "bg-green-500/10 text-green-400"
              : "bg-zinc-800 text-zinc-400"
              }`}
          >
            {project.status}
          </span>
        </div>
        <div>
          <GenerateProjectTasksButton projectId={project.id!} spaceId={project.space_id} />
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Kanban Board */}
        <div className="relative flex-1 overflow-hidden">
          <KanbanBoard project={project} initialTasks={tasks} />
        </div>

        {/* AI Sidebar */}
        <div className="z-20 flex w-80 flex-col overflow-hidden border-l border-border bg-card shadow-xl shadow-black/20">
          <div className="border-b border-border bg-secondary/50 p-4">
            <h2 className="text-sm font-semibold text-muted-foreground">Project Assistant</h2>
          </div>
          <div className="flex-1 overflow-hidden">
            <AIChat project={project} tasks={tasks} />
          </div>
        </div>
      </div>
    </div>
  );
}
