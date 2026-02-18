import Link from "next/link";
import { ArrowRight, Layout, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-4">
      {/* Hero Section */}
      <div className="glass-panel relative z-10 w-full max-w-2xl space-y-8 rounded-3xl border border-white/10 p-12 text-center shadow-2xl backdrop-blur-xl">
        {/* Glow Effect */}
        <div className="absolute top-1/2 left-1/2 -z-10 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/20 blur-[100px]"></div>

        <div className="space-y-2">
          <h1 className="bg-gradient-to-br from-white to-white/60 bg-clip-text text-6xl font-black tracking-tighter text-transparent drop-shadow-lg">
            MindToosa
          </h1>
          <p className="text-xl font-light text-zinc-400">
            Planning + Execution for <span className="font-medium text-indigo-400">Deep Flow</span>.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 pt-8 sm:grid-cols-2">
          <Link
            href="/today"
            className="group flex items-center justify-center gap-3 rounded-xl bg-indigo-600 px-8 py-4 font-bold text-white shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.02] hover:bg-indigo-500"
          >
            <Zap size={20} className="fill-current" />
            <span>Start Flow</span>
            <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
          </Link>

          <Link
            href="/projects"
            className="flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/50 px-6 py-4 font-medium text-zinc-300 transition-all hover:border-zinc-700 hover:bg-zinc-800 hover:text-white"
          >
            <Layout size={20} />
            <span>Manage Projects</span>
          </Link>
        </div>

        <div className="border-t border-white/5 pt-8">
          <Link
            href="/api/auth/signin"
            className="text-xs font-semibold tracking-widest text-zinc-600 uppercase transition hover:text-zinc-400"
          >
            Sign In with Google
          </Link>
        </div>
      </div>
    </div>
  );
}
