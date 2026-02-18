import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { spaceService } from "@/server/services/spaceService";
import { Layers, Globe } from "lucide-react";
import SpaceForm from "./SpaceForm";
import SpaceCard from "./SpaceCard";
import Link from "next/link";

export default async function SpacesPage() {
    const session = await auth();
    if (!session?.user?.email) redirect("/api/auth/signin");

    const userId = session.user.email;
    const spaces = await spaceService.getSpaces(userId);
    const activeSpaces = spaces.filter((s) => !s.archived);
    const archivedSpaces = spaces.filter((s) => s.archived);

    return (
        <div className="min-h-screen p-6 pb-24 max-w-3xl mx-auto md:ml-20">
            <header className="mb-10 space-y-1">
                <Link href="/" className="group mb-4 flex items-center gap-2 text-zinc-500 transition hover:text-white text-sm">
                    ← Back
                </Link>
                <h1 className="flex items-center gap-3 text-4xl font-black tracking-tight text-white">
                    <Layers className="text-indigo-500" size={36} />
                    Spaces
                </h1>
                <p className="text-zinc-500">
                    Separate contexts for different areas of your life. Tasks and goals stay organized within each space.
                </p>
            </header>

            <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
                {/* Left: Form */}
                <div>
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6">
                        <h2 className="mb-5 text-sm font-bold tracking-widest text-zinc-400 uppercase">
                            Create Space
                        </h2>
                        <SpaceForm />
                    </div>
                </div>

                {/* Right: List */}
                <div className="space-y-8">
                    <div>
                        <h2 className="mb-3 text-xs font-bold tracking-widest text-zinc-500 uppercase">
                            Active ({activeSpaces.length})
                        </h2>
                        {activeSpaces.length === 0 ? (
                            <div className="rounded-2xl border-2 border-dashed border-zinc-800 p-8 text-center">
                                <Globe size={32} className="mx-auto mb-3 text-zinc-700" />
                                <p className="text-sm text-zinc-600">No active spaces yet</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {activeSpaces.map((space) => (
                                    <SpaceCard key={space.id} space={space} />
                                ))}
                            </div>
                        )}
                    </div>

                    {archivedSpaces.length > 0 && (
                        <div>
                            <h2 className="mb-3 text-xs font-bold tracking-widest text-zinc-500 uppercase">
                                Archived ({archivedSpaces.length})
                            </h2>
                            <div className="space-y-2">
                                {archivedSpaces.map((space) => (
                                    <SpaceCard key={space.id} space={space} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
