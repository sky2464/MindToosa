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
        <div className="flex h-screen overflow-hidden bg-gray-50 flex-col">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm z-10 shrink-0">
                <div className="flex items-center gap-4">
                    <Link href="/projects" className="text-gray-500 hover:text-gray-900 transition-colors">
                        &larr; Projects
                    </Link>
                    <h1 className="text-xl font-bold text-gray-900">{project.title}</h1>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${project.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                        {project.status}
                    </span>
                </div>
                <div>
                    {/* Add Settings or Delete here if needed */}
                </div>
            </header>

            {/* Main Content Area */}
            <div className="flex flex-1 overflow-hidden">
                {/* Kanban Board */}
                <div className="flex-1 overflow-hidden relative">
                    <KanbanBoard project={project} initialTasks={tasks} />
                </div>

                {/* AI Sidebar */}
                <div className="w-80 border-l border-gray-200 bg-white shadow-xl z-20 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                        <h2 className="font-semibold text-sm text-gray-700">Project Assistant</h2>
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <AIChat project={project} tasks={tasks} />
                    </div>
                </div>
            </div>
        </div>
    );
}
