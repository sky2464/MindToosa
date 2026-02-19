"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Zap, Target, Calendar, Layers, Settings, FolderKanban } from "lucide-react";
import NotificationsPanel from "./NotificationsPanel";

const navItems = [
    { href: "/today", label: "Today", icon: Zap },
    { href: "/week", label: "Week", icon: Calendar },
    { href: "/goals", label: "Goals", icon: Target },
    { href: "/projects", label: "Projects", icon: FolderKanban },
    { href: "/spaces", label: "Spaces", icon: Layers },
    { href: "/settings", label: "Settings", icon: Settings },
];

export default function NavBar() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 md:top-0 md:bottom-auto md:left-0 md:right-auto md:h-screen md:w-16 md:flex md:flex-col md:items-center md:py-6">
            {/* Mobile bottom bar */}
            <div className="flex md:hidden items-center justify-around border-t border-white/5 bg-zinc-950/90 backdrop-blur-xl px-2 py-2">
                {navItems.map(({ href, label, icon: Icon }) => {
                    const isActive = pathname === href || pathname.startsWith(href + "/");
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${isActive
                                ? "text-indigo-400"
                                : "text-zinc-500 hover:text-zinc-300"
                                }`}
                        >
                            <Icon size={20} className={isActive ? "drop-shadow-[0_0_6px_rgba(99,102,241,0.6)]" : ""} />
                            <span className="text-[10px] font-medium tracking-wide">{label}</span>
                        </Link>
                    );
                })}
            </div>

            {/* Desktop sidebar */}
            <div className="hidden md:flex flex-col items-center gap-2 h-full border-r border-white/5 bg-zinc-950/80 backdrop-blur-xl w-16 py-6">
                <Link href="/" aria-label="Home" className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-600/30">
                    <Zap size={18} className="fill-current text-white" />
                </Link>

                <div className="mb-2">
                    <NotificationsPanel />
                </div>

                {navItems.map(({ href, label, icon: Icon }) => {
                    const isActive = pathname === href || pathname.startsWith(href + "/");
                    return (
                        <Link
                            key={href}
                            href={href}
                            title={label}
                            aria-label={label}
                            className={`group relative flex h-10 w-10 items-center justify-center rounded-xl transition-all ${isActive
                                ? "bg-indigo-600/20 text-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.2)]"
                                : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
                                }`}
                        >
                            <Icon size={20} />
                            {/* Tooltip */}
                            <span className="pointer-events-none absolute left-14 whitespace-nowrap rounded-lg border border-white/5 bg-zinc-900 px-2.5 py-1 text-xs font-medium text-zinc-300 opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
                                {label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
