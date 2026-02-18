import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { goalService } from "@/server/services/goalService";
import { spaceService } from "@/server/services/spaceService";
import GoalForm from "@/components/GoalForm";
import GoalItem from "@/components/GoalItem";
import Link from "next/link";
import { ArrowLeft, Target, Calendar, Award } from "lucide-react";

export default async function GoalsPage({
    searchParams,
}: {
    searchParams: Promise<{ view?: string }>;
}) {
    const { view = "active" } = await searchParams;
    const isArchivedView = view === "archived";

    const session = await auth();
    if (!session?.user?.email) {
        redirect("/api/auth/signin");
    }

    const userId = session.user.email;

    // Fetch default space (required for new goals in this simple UI)
    const defaultSpace = await spaceService.ensureDefaultSpace(userId);

    // Fetch goals based on view
    const goals = await goalService.getGoals(userId, { archived: isArchivedView });

    return (
        <div className="min-h-screen p-6 pb-24 max-w-5xl mx-auto md:ml-20">
            <header className="mb-12 flex items-center justify-between">
                <div className="space-y-1">
                    <Link href="/" className="group mb-4 flex items-center gap-2 text-zinc-500 transition hover:text-white">
                        <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
                        <span className="text-sm font-medium">Back to Home</span>
                    </Link>
                    <h1 className="text-4xl font-black tracking-tight text-white flex items-center gap-3">
                        <Target className="text-indigo-500" size={36} />
                        North Stars
                    </h1>
                    <p className="text-zinc-500">Your high-level objectives and long-term vision.</p>
                </div>

                <div className="flex rounded-xl bg-zinc-900/50 p-1 border border-white/5">
                    <Link
                        href="/goals?view=active"
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${!isArchivedView
                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                            : "text-zinc-500 hover:text-white"
                            }`}
                    >
                        Active
                    </Link>
                    <Link
                        href="/goals?view=archived"
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${isArchivedView
                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                            : "text-zinc-500 hover:text-white"
                            }`}
                    >
                        Archived
                    </Link>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Form */}
                <div className="lg:col-span-1">
                    <div className="sticky top-6">
                        <GoalForm spaceId={defaultSpace.id!} />
                    </div>
                </div>

                {/* Right Column: Goal List */}
                <div className="lg:col-span-2 space-y-6">
                    {goals.length === 0 ? (
                        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/20 p-12 text-center flex flex-col items-center justify-center space-y-4">
                            <div className="p-4 rounded-full bg-indigo-500/10 text-indigo-500">
                                < Award size={48} />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-xl font-semibold text-white">No active goals yet</h3>
                                <p className="text-zinc-500 max-w-sm">Every great journey starts with a destination. Set your first North Star to begin.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {goals.map((goal) => (
                                <GoalItem key={goal.id} goal={goal} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
