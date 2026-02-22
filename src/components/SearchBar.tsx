"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Search, X, Loader2, FileText, FolderKanban, Target } from "lucide-react";
import Link from "next/link";
import { apiClient } from "@/lib/apiClient";

interface SearchResult {
  id: string;
  type: "task" | "project" | "goal";
  title: string;
  href: string;
  status?: string;
}

async function searchAction(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];
  try {
    return await apiClient.get<SearchResult[]>(`/api/search?q=${encodeURIComponent(query)}`);
  } catch {
    return [];
  }
}

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    const data = await searchAction(q);
    setResults(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => doSearch(query), 300);
    return () => clearTimeout(timer);
  }, [query, doSearch]);

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Global shortcut: Ctrl+K / Cmd+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
        inputRef.current?.focus();
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const iconForType = (type: string) => {
    switch (type) {
      case "task":
        return <FileText size={14} className="text-indigo-400" />;
      case "project":
        return <FolderKanban size={14} className="text-emerald-400" />;
      case "goal":
        return <Target size={14} className="text-amber-400" />;
      default:
        return <FileText size={14} />;
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-zinc-500" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search tasks, projects, goals... ⌘K"
          aria-label="Search"
          className="w-full rounded-xl border border-zinc-700 bg-zinc-900/50 py-2 pr-8 pl-10 text-sm text-white placeholder-zinc-600 transition outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setResults([]);
            }}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {open && query.trim() && (
        <div className="absolute top-full right-0 left-0 z-50 mt-2 overflow-hidden rounded-xl border border-white/10 bg-zinc-950 shadow-2xl shadow-black/50">
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 size={18} className="animate-spin text-zinc-500" />
            </div>
          ) : results.length === 0 ? (
            <p className="py-6 text-center text-sm text-zinc-600">No results found</p>
          ) : (
            <ul className="max-h-64 divide-y divide-white/5 overflow-y-auto">
              {results.map((r) => (
                <li key={`${r.type}-${r.id}`}>
                  <Link
                    href={r.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-zinc-300 transition hover:bg-zinc-800/50"
                  >
                    {iconForType(r.type)}
                    <span className="flex-1 truncate">{r.title}</span>
                    <span className="shrink-0 rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-500 uppercase">
                      {r.type}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
