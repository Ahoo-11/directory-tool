"use client";

import React, { use, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { ArrowUp, MoveUpRight, Calendar, Star, Tag, ChevronLeft, Pencil, X, Check, Zap, Circle, Power } from "lucide-react";
import cn from "classnames";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useUser } from "@stackframe/stack";
import Link from "next/link";
import { motion } from "framer-motion";

export default function ToolPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const user = useUser();
  const isAdmin = user?.primaryEmail?.toLowerCase() === "ahoo11official@gmail.com";
  const tool = useQuery(api.myFunctions.getTool, { toolId: id as Id<"tools"> });
  const updateTool = useMutation(api.myFunctions.updateTool);

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    tags: "",
    url: "",
    logo: "",
    featured: false,
    upvotes: 0,
    status: "hold" as "online" | "offline" | "hold",
  });

  const startEditing = () => {
    if (!tool) return;
    setForm({
      title: tool.title,
      description: tool.description,
      category: tool.category,
      tags: tool.tags.join(", "),
      url: tool.url,
      logo: tool.logo,
      featured: tool.featured,
      upvotes: tool.upvotes,
      status: tool.status ?? "hold",
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!isAdmin || !tool) return;
    try {
      await updateTool({
        toolId: id as Id<"tools">,
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category.trim() || "General",
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        url: form.url.trim(),
        logo: form.logo.trim() || "✨",
        featured: form.featured,
        upvotes: form.upvotes,
        status: form.status,
      });
      setIsEditing(false);
    } catch (error) {
      console.error(error);
    }
  };

  if (tool === undefined) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-4xl px-4 py-20 text-center">
            <div className="animate-pulse space-y-4">
                <div className="h-12 w-12 mx-auto bg-white/10 rounded-xl" />
                <div className="h-8 w-48 mx-auto bg-white/10 rounded" />
                <div className="h-4 w-96 mx-auto bg-white/10 rounded" />
            </div>
        </div>
      </DashboardLayout>
    );
  }

  if (tool === null) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-4xl px-4 py-20 text-center">
          <h1 className="text-2xl font-bold">Tool not found</h1>
          <Link href="/" className="mt-4 inline-flex text-indigo-400 hover:text-indigo-300">
            Back to directory
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="text-slate-100 font-sans selection:bg-indigo-500/30 p-6">
        <div className="flex items-center justify-between mb-8">
          <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
              <ChevronLeft className="h-4 w-4" />
              Back to Directory
          </Link>

          {isAdmin && !isEditing && (
            <button
              onClick={startEditing}
              className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-400 ring-1 ring-amber-500/20 hover:bg-amber-500/20 transition-colors"
            >
              <Pencil className="h-4 w-4" />
              Edit Tool
            </button>
          )}
        </div>

        {isEditing ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-[#131728]/80 backdrop-blur-xl p-8 md:p-12 shadow-2xl"
          >
            <div className="flex items-center gap-2 text-amber-400 mb-6">
              <Zap className="h-4 w-4 fill-current" />
              <span className="text-xs font-bold uppercase tracking-wide">Edit Mode</span>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1.5 block text-xs font-medium text-slate-400">Title</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-lg font-semibold text-white placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1.5 block text-xs font-medium text-slate-400">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={4}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">Category</label>
                <input
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">Logo (Emoji)</label>
                <input
                  value={form.logo}
                  onChange={(e) => setForm((f) => ({ ...f, logo: e.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">URL</label>
                <input
                  value={form.url}
                  onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">Tags (comma separated)</label>
                <input
                  value={form.tags}
                  onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                  placeholder="ai, productivity, design"
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">Upvotes</label>
                <input
                  type="number"
                  value={form.upvotes}
                  onChange={(e) => setForm((f) => ({ ...f, upvotes: Number(e.target.value) }))}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center">
                <label className="flex items-center gap-2 text-sm text-white cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
                    className="h-4 w-4 rounded border-white/20 bg-white/10 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0"
                  />
                  Featured Tool
                </label>
              </div>

              {/* Status Control */}
              <div className="md:col-span-2 mt-4 pt-4 border-t border-white/5">
                <label className="mb-3 block text-xs font-medium text-slate-400">Visibility Status</label>
                <div className="flex flex-wrap gap-3">
                  {(["online", "hold", "offline"] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, status }))}
                      className={cn(
                        "flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all",
                        form.status === status
                          ? status === "online"
                            ? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30"
                            : status === "hold"
                            ? "bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30"
                            : "bg-red-500/20 text-red-400 ring-1 ring-red-500/30"
                          : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      <Circle className={cn(
                        "h-2.5 w-2.5 fill-current",
                        form.status === status && (
                          status === "online" ? "text-emerald-400" :
                          status === "hold" ? "text-amber-400" : "text-red-400"
                        )
                      )} />
                      {status === "online" ? "Live" : status === "hold" ? "On Hold" : "Offline"}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  {form.status === "online" && "Tool is visible to all users"}
                  {form.status === "hold" && "Tool is hidden from public, only visible to admins"}
                  {form.status === "offline" && "Tool is disabled and hidden from everyone except admins"}
                </p>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-end gap-3 pt-6 border-t border-white/5">
              <button
                onClick={() => setIsEditing(false)}
                className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition-all"
              >
                <Check className="h-4 w-4" />
                Save Changes
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#131728]/80 backdrop-blur-xl p-8 md:p-12 shadow-2xl"
          >
              {/* Background Glow */}
              <div className="absolute top-0 right-0 -mt-20 -mr-20 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
              <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl" />

              <div className="relative flex flex-col md:flex-row gap-8 items-start">
                  <div className="flex-shrink-0">
                      <div className="flex h-32 w-32 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-white/10 text-6xl shadow-inner">
                          {tool.logo}
                      </div>
                  </div>

                  <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                          {tool.featured && (
                              <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400 ring-1 ring-amber-500/20">
                                  <Star className="h-3.5 w-3.5 fill-current" />
                                  Premier Partner
                              </div>
                          )}
                          <span className="inline-flex items-center rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-slate-300 ring-1 ring-white/10">
                              {tool.category}
                          </span>
                      </div>

                      <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
                          {tool.title}
                      </h1>
                      
                      <p className="text-lg text-slate-300 leading-relaxed max-w-2xl mb-8">
                          {tool.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-4">
                          {tool.url && (
                            <a
                                href={tool.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-transform hover:scale-105 active:scale-95"
                            >
                                Visit Website
                                <MoveUpRight className="h-4 w-4" />
                            </a>
                          )}
                          
                          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/5 text-slate-300">
                               <ArrowUp className="h-4 w-4 text-indigo-400" />
                               <span className="font-semibold">{tool.upvotes}</span>
                               <span className="text-sm text-slate-500">Upvotes</span>
                          </div>
                      </div>
                  </div>
              </div>

              <div className="mt-12 pt-8 border-t border-white/5 grid gap-8 md:grid-cols-3">
                  <div className="md:col-span-2">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                          <Tag className="h-4 w-4 text-slate-400" />
                          Tags
                      </h3>
                      <div className="flex flex-wrap gap-2">
                          {tool.tags.length > 0 ? tool.tags.map((tag) => (
                              <span key={tag} className="rounded-lg bg-white/5 px-3 py-1.5 text-sm font-medium text-slate-300 border border-white/5">
                                  {tag}
                              </span>
                          )) : (
                            <span className="text-sm text-slate-500">No tags yet</span>
                          )}
                      </div>
                  </div>

                  <div>
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          Added
                      </h3>
                      <p className="text-slate-400">
                          {new Date(tool._creationTime).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                          })}
                      </p>
                  </div>
              </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
