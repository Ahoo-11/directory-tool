"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { motion, AnimatePresence } from "framer-motion";
import { Bookmark, MoveUpRight, ArrowUp, Search, Pencil, Trash2, Plus, LogIn, Star, Filter, X, ChevronRight, Zap, LayoutGrid, PenTool, Code, Image as ImageIcon, Music, BarChart, Hash } from "lucide-react";
import { UserButton, useUser } from "@stackframe/stack";
import { stackClientApp } from "@/stack/client";
import { api } from "../convex/_generated/api";
import cn from "classnames";
import Link from "next/link";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useSavedTools } from "@/lib/useSavedTools";

type Tool = {
  _id: string;
  _creationTime: number;
  title: string;
  description: string;
  category: string;
  tags: string[];
  url: string;
  logo: string;
  featured: boolean;
  upvotes: number;
  status?: "online" | "offline" | "hold";
  pricing?: string;
};

const baseCategories = ["All", "Copywriting", "Coding", "Image Gen", "Audio", "Analytics", "Productivity"];
const initialFormState = {
  title: "",
  description: "",
  category: "",
  tags: "",
  url: "",
  logo: "",
  featured: false,
  upvotes: 0,
};

export default function Home() {
  const user = useUser();
  const isAdmin = user?.primaryEmail?.toLowerCase() === "ahoo11official@gmail.com";
  const isLoggedIn = !!user;

  const [category, setCategory] = useState<string>("All");
  const [tag, setTag] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const { saved, toggleSaved, isSaved } = useSavedTools();
  const [showAddModal, setShowAddModal] = useState(false);
  const [quickForm, setQuickForm] = useState({ title: "", description: "" });

  const seedTools = useMutation(api.myFunctions.seedTools);
  const upvoteTool = useMutation(api.myFunctions.upvoteTool);
  const createTool = useMutation(api.myFunctions.createTool);
  const updateTool = useMutation(api.myFunctions.updateTool);
  const deleteTool = useMutation(api.myFunctions.deleteTool);

  const data = useQuery(api.myFunctions.listTools, {
    category,
    search: search.trim() || undefined,
    tag: tag || undefined,
    includeAll: isAdmin ? true : undefined,
  });

  useEffect(() => {
    void seedTools({});
  }, [seedTools]);

  const tools = data?.tools ?? [];

  const categories = useMemo(() => {
    const fromData = Array.from(new Set((data?.tools ?? []).map((t) => t.category)));
    return Array.from(new Set([...baseCategories, ...fromData]));
  }, [data?.tools]);

  const tags = useMemo(() => {
    const list = new Set<string>();
    for (const t of data?.tools ?? []) {
      t.tags.forEach((tagVal) => list.add(tagVal));
    }
    return Array.from(list).sort();
  }, [data?.tools]);

  const handleSave = (id: string) => {
    toggleSaved(id);
  };

  const handleUpvote = async (id: string) => {
    try {
      await upvoteTool({ toolId: id as any });
    } catch (error) {
      console.error(error);
    }
  };

  const handleQuickAdd = async () => {
    if (!isAdmin || !quickForm.title.trim()) return;
    try {
      const result = await createTool({
        title: quickForm.title.trim(),
        description: quickForm.description.trim(),
        category: "General",
        tags: [],
        url: "",
        logo: "✨",
        featured: false,
        upvotes: 0,
      });
      setQuickForm({ title: "", description: "" });
      setShowAddModal(false);
      // Navigate to the new tool page to complete details
      if (result?.toolId) {
        window.location.href = `/tool/${result.toolId}`;
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) return;
    try {
      await deleteTool({ toolId: id as any });
    } catch (error) {
      console.error(error);
    }
  };

  const loading = !data;

  return (
    <DashboardLayout>
      <div className="text-slate-100 font-sans selection:bg-indigo-500/30 p-6">
        {!isLoggedIn && <Hero search={search} setSearch={setSearch} />}

        <div className={cn("flex flex-col gap-6", !isLoggedIn && "mt-8")}>
          <HorizontalFilters
            categories={categories}
            selectedCategory={category}
            onSelectCategory={setCategory}
            tags={tags}
            selectedTag={tag}
            onSelectTag={(value) => setTag((prev) => (prev === value ? null : value))}
          />

          {isAdmin && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition-all"
              >
                <Plus className="h-4 w-4" />
                Add New Tool
              </button>
              <span className="text-xs text-amber-400 font-medium uppercase tracking-wide flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 fill-current" />
                Admin Mode
              </span>
            </div>
          )}

          {/* Quick Add Modal */}
          <AnimatePresence>
            {showAddModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                onClick={() => setShowAddModal(false)}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#131728] p-6 shadow-2xl"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-white">Add New Tool</h2>
                    <button
                      onClick={() => setShowAddModal(false)}
                      className="rounded-full p-2 text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-slate-400">Title *</label>
                      <input
                        value={quickForm.title}
                        onChange={(e) => setQuickForm((f) => ({ ...f, title: e.target.value }))}
                        placeholder="Enter tool name..."
                        className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        autoFocus
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-slate-400">Description</label>
                      <textarea
                        value={quickForm.description}
                        onChange={(e) => setQuickForm((f) => ({ ...f, description: e.target.value }))}
                        placeholder="Brief description of the tool..."
                        rows={4}
                        className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                      />
                    </div>
                  </div>

                  <p className="mt-4 text-xs text-slate-500">
                    You can add more details (category, tags, URL, etc.) after saving on the tool page.
                  </p>

                  <div className="mt-6 flex items-center justify-end gap-3">
                    <button
                      onClick={() => setShowAddModal(false)}
                      className="rounded-full px-5 py-2.5 text-sm font-medium text-slate-400 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleQuickAdd}
                      disabled={!quickForm.title.trim()}
                      className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="h-4 w-4" />
                      Save & Continue
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-xl font-semibold text-white tracking-tight">
                {category === "All" ? "All Partners" : category}
                <span className="ml-2 text-sm font-normal text-slate-400">{tools.length} results</span>
              </h2>
            </div>

            {loading ? (
              <SkeletonGrid />
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {tools.map((tool) => (
                  <ToolCard
                    key={tool._id}
                    tool={tool}
                    saved={isSaved(tool._id)}
                    onSave={() => handleSave(tool._id)}
                    onUpvote={() => handleUpvote(tool._id)}
                    isAdmin={isAdmin}
                    onDelete={() => handleDelete(tool._id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function ToolCard({
  tool,
  saved,
  onSave,
  onUpvote,
  isAdmin,
  onDelete,
}: {
  tool: Tool;
  saved: boolean;
  onSave: () => void;
  onUpvote: () => void;
  isAdmin?: boolean;
  onDelete?: () => void;
}) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-[#1A1A1A] p-6 shadow-xl transition-all hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/20"
    >
      {/* Background Gradient Effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none" />

      <div>
        <div className="relative flex items-start justify-between">
          <Link href={`/tool/${tool._id}`} className="block">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#252525] border border-white/5 text-4xl shadow-inner transition-transform group-hover:scale-110">
              {tool.logo}
            </div>
          </Link>
          <div className="flex flex-col items-end gap-2">
            <div className="flex gap-2">
              {tool.featured && (
                <div className="flex items-center justify-center rounded-full bg-amber-500/10 p-1.5 text-amber-400 ring-1 ring-amber-500/20">
                  <Star className="h-3.5 w-3.5 fill-current" />
                </div>
              )}
              <button
                onClick={onSave}
                className={cn(
                  "rounded-full p-2 transition-colors",
                  saved ? "text-indigo-400 bg-indigo-500/10" : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                )}
              >
                <Bookmark className={cn("h-4 w-4", saved && "fill-current")} />
              </button>
            </div>
            {/* Pricing Badge */}
            {tool.pricing && (
              <span className={cn(
                "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide border",
                tool.pricing === "Free" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                  tool.pricing === "Paid" ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                    "bg-blue-500/10 text-blue-400 border-blue-500/20"
              )}>
                {tool.pricing}
              </span>
            )}
          </div>
        </div>

        <Link href={`/tool/${tool._id}`} className="block mt-5 group-hover:cursor-pointer">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold text-white tracking-tight transition-colors group-hover:text-indigo-400">{tool.title}</h3>
            {isAdmin && tool.status && tool.status !== "online" && (
              <span className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                tool.status === "hold" ? "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20" : "bg-red-500/10 text-red-400 ring-1 ring-red-500/20"
              )}>
                {tool.status}
              </span>
            )}
          </div>
          <p className="text-xs font-bold text-indigo-400 mt-1 uppercase tracking-wider">{tool.category}</p>
          <p className="mt-3 text-sm leading-relaxed text-[#A0A0A0] line-clamp-3 font-medium">{tool.description}</p>
        </Link>

        <div className="mt-5 flex flex-wrap gap-2">
          {tool.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-md bg-[#252525] px-2.5 py-1 text-[11px] font-medium text-slate-400 border border-white/5 group-hover:border-white/10 transition-colors">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between gap-3">
        <button
          onClick={onUpvote}
          className="group/upvote flex items-center gap-1.5 text-xs font-medium text-slate-400 transition-colors hover:text-white"
        >
          <div className="flex items-center justify-center rounded-md bg-[#252525] p-1.5 group-hover/upvote:bg-indigo-500 group-hover/upvote:text-white transition-colors">
            <ArrowUp className="h-3.5 w-3.5" />
          </div>
          <span>{tool.upvotes}</span>
        </button>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <div className="flex gap-1">
              <Link href={`/tool/${tool._id}`} className="p-1.5 text-slate-400 hover:text-amber-400 transition-colors">
                <Pencil className="h-3.5 w-3.5" />
              </Link>
              <button onClick={onDelete} className="p-1.5 text-slate-400 hover:text-red-400 transition-colors">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          <a
            href={tool.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-bold text-slate-900 transition-transform hover:scale-105 active:scale-95 shadow-lg shadow-white/10"
          >
            Visit
            <MoveUpRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </motion.div>
  );
}

function Hero({ search, setSearch }: { search: string; setSearch: (v: string) => void }) {
  return (
    <section className="relative mt-8 mb-20 flex flex-col items-center text-center">
      {/* Mesh Gradient Background */}
      <div className="absolute inset-0 -z-10 top-[-50%] overflow-hidden pointer-events-none select-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-indigo-600/20 blur-[100px] rounded-full mix-blend-screen opacity-50" />
        <div className="absolute top-[10%] left-[20%] w-[600px] h-[400px] bg-purple-500/10 blur-[80px] rounded-full mix-blend-screen opacity-40" />
        <div className="absolute top-[10%] right-[20%] w-[600px] h-[400px] bg-cyan-500/10 blur-[80px] rounded-full mix-blend-screen opacity-40" />
      </div>

      <div className="relative z-10 max-w-2xl px-4">
        <h1 className="text-4xl sm:text-6xl font-bold text-white tracking-tight mb-6">
          Find your perfect <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 animate-gradient-x">
            growth partner
          </span>
        </h1>
        <p className="text-lg sm:text-xl text-slate-400 mb-10 max-w-xl mx-auto leading-relaxed">
          Connect with verified experts to accelerate your product strategy.
        </p>
      </div>

      {/* Glass Dock Search */}
      <div className="glass-dock sticky top-20 z-40 flex w-full max-w-xl items-center gap-3 rounded-2xl px-5 py-4 transition-all focus-within:ring-2 focus-within:ring-indigo-500/50 border border-indigo-500/20 shadow-lg shadow-indigo-500/10">
        <Search className="h-5 w-5 text-indigo-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search partners..."
          className="w-full bg-transparent text-lg text-white placeholder:text-slate-500 focus:outline-none"
        />
        {search && (
          <button onClick={() => setSearch("")} className="text-slate-500 hover:text-white transition-colors">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Social Proof */}
      <div className="mt-6 flex items-center gap-2 text-sm text-slate-500 animate-fade-in-up">
        <div className="flex -space-x-2 mr-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-6 w-6 rounded-full border-2 border-[#0A0A0C] bg-slate-800 flex items-center justify-center overflow-hidden">
              <div className={`w-full h-full bg-gradient-to-br ${i === 1 ? 'from-indigo-500 to-purple-500' : i === 2 ? 'from-cyan-500 to-blue-500' : 'from-emerald-500 to-teal-500'} opacity-80`} />
            </div>
          ))}
        </div>
        <p>
          Trusted by <span className="text-slate-300 font-medium">5,000+ founders</span>.
          <span className="text-slate-300 font-medium ml-1">150+ tools</span> added this week.
        </p>
      </div>
    </section>
  );
}

function HorizontalFilters({
  categories,
  selectedCategory,
  onSelectCategory,
  tags,
  selectedTag,
  onSelectTag,
}: {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (v: string) => void;
  tags: string[];
  selectedTag: string | null;
  onSelectTag: (v: string) => void;
}) {
  const [showFilters, setShowFilters] = useState(false);

  const categoryIcons: Record<string, any> = {
    "All": LayoutGrid,
    "Copywriting": PenTool,
    "Coding": Code,
    "Image Gen": ImageIcon,
    "Audio": Music,
    "Analytics": BarChart,
    "Productivity": Zap,
  };

  return (
    <div className="relative flex items-center gap-3">
      {/* Categories Row */}
      <div className="no-scrollbar flex flex-1 items-center gap-2 overflow-x-auto pb-2 px-1 mask-linear-fade">
        {categories.map((cat) => {
          const Icon = categoryIcons[cat] || Hash;
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className={cn(
                "group flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all border",
                isActive
                  ? "bg-white/10 border-indigo-500/50 text-white shadow-[0_0_20px_rgba(99,102,241,0.3)]"
                  : "border-transparent bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white hover:border-white/10"
              )}
            >
              <Icon className={cn("h-4 w-4 transition-colors", isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300")} />
              {cat}
            </button>
          );
        })}
      </div>

      {/* Filter Button & Dropdown */}
      <div className="relative z-20">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all border",
            showFilters || selectedTag
              ? "bg-white/10 border-indigo-500/50 text-white shadow-[0_0_20px_rgba(99,102,241,0.3)]"
              : "border-transparent bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white hover:border-white/10"
          )}
        >
          <Filter className="h-4 w-4" />
          <span>Filters</span>
          {selectedTag && (
            <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-[10px] text-white">
              1
            </span>
          )}
        </button>

        <AnimatePresence>
          {showFilters && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowFilters(false)} />
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-white/10 bg-[#131728] p-4 shadow-2xl z-20 ring-1 ring-white/5"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-white">Filter by Tags</h3>
                  {selectedTag && (
                    <button
                      onClick={() => {
                        onSelectTag(selectedTag); // This toggles it off based on parent logic
                        setShowFilters(false);
                      }}
                      className="text-xs text-indigo-400 hover:text-indigo-300"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                  {tags.map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        onSelectTag(t);
                        // Optional: keep open or close? Let's keep open for multiple selection if supported, but here it's single select.
                        // User might want to explore. Let's keep it open or close. 
                        // Usually single select closes. But let's leave it open for better UX if they change mind.
                        // Actually, let's close it for now to be clean.
                        setShowFilters(false);
                      }}
                      className={cn(
                        "rounded-md px-3 py-1.5 text-xs font-medium transition-all border",
                        selectedTag === t
                          ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-300"
                          : "border-white/5 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white hover:border-white/10"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                  {tags.length === 0 && (
                    <p className="text-xs text-slate-500 py-2">No tags available for this category.</p>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, idx) => (
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
