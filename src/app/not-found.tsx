import Link from "next/link";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
    return (
        <div className="flex min-h-screen items-center justify-center p-6">
            <div className="glass-card mx-auto max-w-md space-y-6 rounded-2xl p-8 text-center">
                <div className="flex justify-center">
                    <div className="rounded-full bg-indigo-500/10 p-4">
                        <FileQuestion className="h-8 w-8 text-indigo-400" />
                    </div>
                </div>
                <div>
                    <h1 className="text-4xl font-black text-foreground">404</h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        The page you&apos;re looking for doesn&apos;t exist or has been moved.
                    </p>
                </div>
                <Link
                    href="/today"
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
                >
                    Go to Today
                </Link>
            </div>
        </div>
    );
}
