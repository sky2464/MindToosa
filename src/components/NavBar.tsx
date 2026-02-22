"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Zap,
  Target,
  Calendar,
  Layers,
  Settings,
  FolderKanban,
  CircleHelp,
  BookOpen,
  Info,
  MessageCircle,
  Search,
  X,
  Tag,
  Trash2,
} from "lucide-react";
import NotificationsPanel from "./NotificationsPanel";
import SearchBar from "./SearchBar";
import ShortcutsDialog from "./ShortcutsDialog";

const navItems = [
  { href: "/today", label: "Today", icon: Zap },
  { href: "/week", label: "Week", icon: Calendar },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/spaces", label: "Spaces", icon: Layers },
  { href: "/labels", label: "Labels", icon: Tag },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/trash", label: "Trash", icon: Trash2 },
];

const resourceItems = [
  { href: "/help", label: "Help", icon: CircleHelp },
  { href: "/docs", label: "Docs", icon: BookOpen },
  { href: "/about", label: "About", icon: Info },
  { href: "/support", label: "Support", icon: MessageCircle },
];

export default function NavBar() {
  const pathname = usePathname();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  return (
    <>
      {/* Global keyboard shortcuts dialog */}
      <ShortcutsDialog />

      {/* Persistent search bar — desktop only (top-right, always in DOM for Cmd+K) */}
      <div className="fixed top-4 right-4 z-40 hidden w-72 md:block">
        <SearchBar />
      </div>

      {/* Mobile search overlay */}
      {mobileSearchOpen && (
        <div className="fixed inset-0 z-50 flex flex-col gap-3 bg-zinc-950/95 p-4 pt-10 backdrop-blur-sm md:hidden">
          <SearchBar />
          <button
            onClick={() => setMobileSearchOpen(false)}
            className="flex items-center gap-2 self-start text-sm text-zinc-400 hover:text-white"
          >
            <X size={16} /> Close
          </button>
        </div>
      )}

      <nav className="fixed right-0 bottom-0 left-0 z-50 md:top-0 md:right-auto md:bottom-auto md:left-0 md:flex md:h-screen md:w-16 md:flex-col md:items-center md:py-6">
        {/* Mobile bottom bar */}
        <div className="relative flex w-full border-t border-white/5 bg-zinc-950/90 backdrop-blur-xl md:hidden">
          {/* Scroll indicators */}
          <div className="pointer-events-none absolute top-0 bottom-0 left-0 z-10 w-4 bg-gradient-to-r from-zinc-950 to-transparent"></div>
          <div className="pointer-events-none absolute top-0 right-0 bottom-0 z-10 w-4 bg-gradient-to-l from-zinc-950 to-transparent"></div>

          <div className="no-scrollbar flex w-full items-center justify-start overflow-x-auto px-2 py-2">
            <button
              onClick={() => setMobileSearchOpen(true)}
              className="flex flex-shrink-0 flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-zinc-500 transition-all hover:text-zinc-300"
              aria-label="Search"
            >
              <Search size={20} />
              <span className="text-[10px] font-medium tracking-wide">Search</span>
            </button>
            <div className="flex flex-shrink-0 flex-col items-center gap-1">
              <NotificationsPanel direction="up" />
              <span className="text-[10px] font-medium tracking-wide text-zinc-500">Alerts</span>
            </div>
            {navItems.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex flex-shrink-0 flex-col items-center gap-1 rounded-xl px-3 py-1.5 transition-all ${
                    isActive ? "text-indigo-400" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  <Icon
                    size={20}
                    className={isActive ? "drop-shadow-[0_0_6px_rgba(99,102,241,0.6)]" : ""}
                  />
                  <span className="text-[10px] font-medium tracking-wide">{label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Desktop sidebar */}
        <div className="hidden h-full w-16 flex-col items-center gap-2 overflow-y-auto border-r border-white/5 bg-zinc-950/80 py-6 backdrop-blur-xl md:flex">
          <Link
            href="/"
            aria-label="Home"
            className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-600/30"
          >
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
                className={`group relative flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                  isActive
                    ? "bg-indigo-600/20 text-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.2)]"
                    : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
                }`}
              >
                <Icon size={20} />
                {/* Tooltip */}
                <span className="pointer-events-none absolute left-14 rounded-lg border border-white/5 bg-zinc-900 px-2.5 py-1 text-xs font-medium whitespace-nowrap text-zinc-300 opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
                  {label}
                </span>
              </Link>
            );
          })}

          {/* Divider */}
          <div className="my-4 h-px w-8 bg-white/5" />

          {/* Resource Items */}
          {resourceItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                title={label}
                aria-label={label}
                className={`group relative flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                  isActive
                    ? "bg-indigo-600/20 text-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.2)]"
                    : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
                }`}
              >
                <Icon size={20} />
                {/* Tooltip */}
                <span className="pointer-events-none absolute left-14 rounded-lg border border-white/5 bg-zinc-900 px-2.5 py-1 text-xs font-medium whitespace-nowrap text-zinc-300 opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
