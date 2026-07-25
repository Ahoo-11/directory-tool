"use client";

import React from "react";
import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import { Bookmark, MoveUpRight, Star } from "lucide-react";
import { api } from "../../convex/_generated/api";
import cn from "classnames";
import Link from "next/link";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useSavedTools } from "@/lib/useSavedTools";
import { ToolLogo } from "@/components/ToolLogo";

type Tool = {
  _id: string;
  _creationTime: number;
  title: string;
  description: string;
  category: string;
  type?: string;
  tags: string[];
  url: string;
  logo: string;
  featured: boolean;
};

export default function SavedPage() {
  const { saved, isLoaded, toggleSaved, isSaved } = useSavedTools();
  
  // Get all tools and filter by saved IDs
  const data = useQuery(api.myFunctions.listTools, {
    category: "All",
  });

  const allTools = data?.tools ?? [];
  const savedTools = allTools.filter((tool) => saved.has(tool._id));

  const loading = !data || !isLoaded;

  return (
    <DashboardLayout>
      <div className="text-zinc-900 dark:text-slate-100 font-sans selection:bg-indigo-200/70 dark:selection:bg-indigo-500/30 p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Bookmark className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-zinc-950 dark:text-white">Saved Tools</h1>
              <p className="text-sm text-zinc-500 dark:text-slate-400">Your bookmarked AI tools</p>
            </div>
          </div>
        </div>

        {loading ? (
          <SkeletonGrid />
        ) : savedTools.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-white/5 mb-4">
              <Bookmark className="h-8 w-8 text-zinc-400 dark:text-slate-500" />
            </div>
            <h2 className="text-xl font-semibold text-zinc-950 dark:text-white mb-2">No saved tools yet</h2>
            <p className="text-zinc-600 dark:text-slate-400 max-w-md mb-6">
              Click the bookmark icon on any tool to save it here for quick access.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition-all"
            >
              Browse Tools
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-zinc-500 dark:text-slate-400 px-1">
              {savedTools.length} saved tool{savedTools.length !== 1 ? "s" : ""}
            </p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {savedTools.map((tool) => (
                <ToolCard
                  key={tool._id}
                  tool={tool}
                  saved={isSaved(tool._id)}
                  onToggleSave={() => toggleSaved(tool._id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function ToolCard({
  tool,
  saved,
  onToggleSave,
}: {
  tool: Tool;
  saved: boolean;
  onToggleSave: () => void;
}) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:border-zinc-300 hover:shadow-md dark:border-white/5 dark:bg-[#131728]/60 dark:hover:border-white/10 dark:hover:shadow-2xl dark:hover:shadow-indigo-500/10"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/5 to-transparent dark:from-white/5 opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none" />
      
      <div>
        <div className="relative flex items-start justify-between">
          <Link href={`/tool/${tool._id}`} className="block">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-zinc-50 border border-zinc-200 text-3xl shadow-inner transition-transform group-hover:scale-110 dark:bg-gradient-to-br dark:from-indigo-500/10 dark:to-purple-500/10 dark:border-white/5">
              <ToolLogo value={tool.logo} title={tool.title} className="h-full w-full object-contain p-2" />
            </div>
          </Link>
          <div className="flex gap-2">
            {tool.featured && (
              <div className="flex items-center justify-center rounded-full bg-amber-500/10 p-1.5 text-amber-500 dark:text-amber-400 ring-1 ring-amber-500/20">
                <Star className="h-3.5 w-3.5 fill-current" />
              </div>
            )}
            <button
              onClick={onToggleSave}
              className={cn(
                "rounded-full p-2 transition-colors",
                saved ? "text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-500/10" : "text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:text-slate-500 dark:hover:text-slate-300 dark:hover:bg-white/5"
              )}
              title="Remove from saved"
            >
              <Bookmark className={cn("h-4 w-4", saved && "fill-current")} />
            </button>
          </div>
        </div>

        <Link href={`/tool/${tool._id}`} className="block mt-4 group-hover:cursor-pointer">
          <h3 className="text-lg font-bold text-zinc-950 tracking-tight transition-colors group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">{tool.title}</h3>
          <p className="text-xs font-medium text-zinc-400 mt-1 uppercase tracking-wider dark:text-slate-400">{tool.category}</p>
          <p className="mt-3 text-sm leading-relaxed text-zinc-600 line-clamp-3 dark:text-slate-300">{tool.description}</p>
        </Link>

        <div className="mt-4 flex flex-wrap gap-2">
          {tool.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-md bg-zinc-100 px-2 py-1 text-[10px] font-medium text-zinc-600 border border-zinc-200 dark:bg-white/5 dark:text-slate-400 dark:border-white/5">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-end gap-3 dark:border-white/5">
        <a
          href={tool.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-full bg-zinc-950 px-3 py-1.5 text-xs font-bold text-white transition-all hover:bg-zinc-800 dark:bg-white dark:text-slate-900 dark:hover:scale-105 active:scale-95"
        >
          Visit
          <MoveUpRight className="h-3.5 w-3.5" />
        </a>
      </div>
    </motion.div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, idx) => (
        <div key={idx} className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/5 p-6 h-[280px]">
          <div className="absolute inset-0 shimmer opacity-20" />
          <div className="flex items-start justify-between">
            <div className="h-14 w-14 rounded-xl bg-white/10" />
            <div className="h-8 w-8 rounded-full bg-white/10" />
          </div>
          <div className="mt-6 space-y-3">
            <div className="h-5 w-3/4 rounded bg-white/10" />
            <div className="h-3 w-1/4 rounded bg-white/10" />
            <div className="h-16 w-full rounded bg-white/5" />
          </div>
        </div>
      ))}
    </div>
  );
}
