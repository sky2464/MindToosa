import { auth } from "@/auth";
import { projectService } from "@/server/services/projectService";
import { spaceService } from "@/server/services/spaceService";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createProjectAction } from "./actions";
import { Trash2, FolderPlus, ArrowRight } from "lucide-react";
import NewProjectForm from "./NewProjectForm";

export default async function ProjectsPage() {
    const session = await auth();
    if (!session?.user?.email) redirect("/api/auth/signin");

    const userId = session.user.email;
    const projects = await projectService.getProjects();
    const defaultSpace = await spaceService.ensureDefaultSpace(userId);

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-8">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
                    <p className="text-gray-500 mt-1">Manage your big goals and tasks.</p>
                </div>
                <Link href="/today" className="text-sm font-medium text-gray-600 hover:text-black">
                    &larr; Back to Today
                </Link>
            </header>

            {/* Project List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                    <div key={project.id} className="group relative bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all hover:border-gray-300">
                        <Link href={`/projects/${project.id}`} className="absolute inset-0 z-0">
                            <span className="sr-only">View project</span>
                        </Link>
                        <div className="flex justify-between items-start z-10 relative">
                            <h3 className="font-semibold text-lg text-gray-900 line-clamp-1 group-hover:text-blue-600">{project.title}</h3>
                            <div className="flex gap-2">
                                {/* We can put delete button here if we make it a client component or use a form */}
                            </div>
                        </div>
                        <p className="text-sm text-gray-500 mt-2 line-clamp-2 min-h-[40px]">
                            {project.description || "No description provided."}
                        </p>

                        <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
                            <span>{new Date(project.created_at!).toLocaleDateString()}</span>
                            <span className={`px-2 py-1 rounded-full ${project.status === 'active' ? 'bg-green-50 text-green-600' :
                                    project.status === 'completed' ? 'bg-blue-50 text-blue-600' :
                                        'bg-gray-100 text-gray-600'
                                }`}>
                                {project.status.replace('_', ' ')}
                            </span>
                        </div>
                    </div>
                ))}

                {/* Create New Card */}
                <NewProjectForm spaceId={defaultSpace?.id!} />
            </div>
        </div>
    );
}
