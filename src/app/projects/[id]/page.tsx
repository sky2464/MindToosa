import { auth } from "@/auth";
import { projectService } from "@/server/services/projectService";
import { notFound, redirect } from "next/navigation";
import KanbanBoard from "@/components/KanbanBoard";
import AIChat from "@/components/AIChat";
import Link from "next/link";
import { deleteProjectAction } from "../actions";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.email) redirect("/api/auth/signin");

  const { id } = await params;
  const project = await projectService.getProjectById(id);

  if (!project) notFound();

  const tasks = await projectService.getProjectTasks(id);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gray-50">
      {/* Header */}
      <header className="z-10 flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6 py-4 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/projects" className="text-gray-500 transition-colors hover:text-gray-900">
            &larr; Projects
          </Link>
          <h1 className="text-xl font-bold text-gray-900">{project.title}</h1>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              project.status === "active"
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {project.status}
          </span>
        </div>
        <div>{/* Add Settings or Delete here if needed */}</div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Kanban Board */}
        <div className="relative flex-1 overflow-hidden">
          <KanbanBoard project={project} initialTasks={tasks} />
        </div>

        {/* AI Sidebar */}
        <div className="z-20 flex w-80 flex-col overflow-hidden border-l border-gray-200 bg-white shadow-xl">
          <div className="border-b border-gray-100 bg-gray-50/50 p-4">
            <h2 className="text-sm font-semibold text-gray-700">Project Assistant</h2>
          </div>
          <div className="flex-1 overflow-hidden">
            <AIChat project={project} tasks={tasks} />
          </div>
        </div>
      </div>
    </div>
  );
}
