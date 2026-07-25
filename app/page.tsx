"use client";

import React, { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bookmark,
  Filter,
  MoveUpRight,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import { useUser } from "@stackframe/stack";
import Link from "next/link";
import cn from "classnames";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useSavedTools } from "@/lib/useSavedTools";
import { stackClientApp } from "@/stack/client";
import { SubmitToolModal } from "@/components/SubmitToolModal";
import { ToolLogo } from "@/components/ToolLogo";

type Tool = {
  _id: Id<"tools">;
  _creationTime: number;
  title: string;
  description: string;
  category: string;
  type?: string;
  tags: string[];
  url: string;
  logo: string;
  featured: boolean;
  status?: "online" | "offline" | "hold";
  pricing?: string;
};

const toolTypes = [
  "Web App",
  "Mobile App",
  "Website",
  "Desktop App",
  "Browser Extension",
  "API",
  "CLI Tool",
  "Library/SDK",
  "Plugin",
  "Platform/SaaS",
  "Game",
  "Other",
];

const baseCategories = ["All", "Copywriting", "Coding", "Image Gen", "Audio", "Analytics", "Productivity"];

export default function Home() {
  const user = useUser();
  const isAdmin = user?.primaryEmail?.toLowerCase() === "ahoo11official@gmail.com";

  const [category, setCategory] = useState("All");
  const [tag, setTag] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [quickForm, setQuickForm] = useState({
    title: "",
    description: "",
    category: "",
    type: "Web App",
  });
  const { toggleSaved, isSaved } = useSavedTools();

  const createTool = useMutation(api.myFunctions.createTool);
  const createCategory = useMutation(api.myFunctions.createCategory);
  const deleteTool = useMutation(api.myFunctions.deleteTool);
  const categoriesData = useQuery(api.myFunctions.listCategories, {});

  const data = useQuery(api.myFunctions.listTools, {
    category,
    search: search.trim() || undefined,
    tag: tag || undefined,
    includeAll: isAdmin ? true : undefined,
  });

  const tools = data?.tools ?? [];

  const categories = useMemo(() => {
    const fromData = Array.from(new Set((data?.tools ?? []).map((tool) => tool.category)));
    return Array.from(new Set([...baseCategories, ...fromData]));
  }, [data?.tools]);

  const tags = useMemo(() => {
    const list = new Set<string>();
    for (const tool of data?.tools ?? []) {
      tool.tags.forEach((tagValue) => list.add(tagValue));
    }
    return Array.from(list).sort();
  }, [data?.tools]);

  const handleQuickAdd = async () => {
    if (!isAdmin || !quickForm.title.trim()) return;

    const category = quickForm.category.trim() || "General";

    try {
      const result = await createTool({
        title: quickForm.title.trim(),
        description: quickForm.description.trim(),
        category,
        type: quickForm.type,
        tags: [],
        url: "",
        logo: "*",
        featured: false,
      });
      setQuickForm({ title: "", description: "", category: "", type: "Web App" });
      setShowAddModal(false);

      if (result?.toolId) {
        window.location.href = `/tool/${result.toolId}`;
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id: Id<"tools">) => {
    if (!isAdmin) return;

    try {
      await deleteTool({ toolId: id });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <DashboardLayout>
      <div className="public-home min-h-[calc(100vh-4rem)] bg-[#f7f7f5] px-5 py-8 text-zinc-950 selection:bg-indigo-200/70 dark:bg-[#0f1014] dark:text-zinc-50 dark:selection:bg-indigo-500/30">
        <div className="mx-auto flex max-w-[1220px] flex-col gap-8">
          <DirectoryHeader
            search={search}
            setSearch={setSearch}
            categories={categories}
            selectedCategory={category}
            onSelectCategory={setCategory}
            tags={tags}
            selectedTag={tag}
            onSelectTag={(value) => setTag((previous) => (previous === value ? null : value))}
            resultCount={tools.length}
            isAdmin={isAdmin}
            onAddTool={() => {
              if (isAdmin) {
                setShowAddModal(true);
                return;
              }
              if (!user) {
                window.location.href = stackClientApp.urls.signIn;
                return;
              }
              setShowSubmitModal(true);
            }}
          />

          {isAdmin && (
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-amber-600">
                <Zap className="h-3.5 w-3.5 fill-current" />
                Admin Mode
              </span>
            </div>
          )}

          <AnimatePresence>
            {showAddModal && (
              <QuickAddModal
                quickForm={quickForm}
                setQuickForm={setQuickForm}
                onClose={() => setShowAddModal(false)}
                onSave={handleQuickAdd}
                existingCategories={(categoriesData ?? []).map((c) => c.name)}
                toolTypes={toolTypes}
                onCreateCategory={async (name) => {
                  try {
                    await createCategory({ name });
                  } catch (error) {
                    console.error(error);
                  }
                }}
              />
            )}
          </AnimatePresence>

          <section className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="public-title text-sm font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                Available tools
                <span className="public-muted ml-2 text-xs font-normal text-zinc-500 dark:text-zinc-400">{tools.length} results</span>
              </h2>
            </div>

            {!data ? (
              <SkeletonGrid />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {tools.map((tool) => (
                  <ToolCard
                    key={tool._id}
                    tool={tool}
                    saved={isSaved(tool._id)}
                    onSave={() => toggleSaved(tool._id)}
                    isAdmin={isAdmin}
                    onDelete={() => handleDelete(tool._id)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
      <SubmitToolModal open={showSubmitModal} onClose={() => setShowSubmitModal(false)} />
    </DashboardLayout>
  );
}

function DirectoryHeader({
  search,
  setSearch,
  categories,
  selectedCategory,
  onSelectCategory,
  tags,
  selectedTag,
  onSelectTag,
  resultCount,
  onAddTool,
  isAdmin,
}: {
  search: string;
  setSearch: (value: string) => void;
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (value: string) => void;
  tags: string[];
  selectedTag: string | null;
  onSelectTag: (value: string) => void;
  resultCount: number;
  onAddTool: () => void;
  isAdmin: boolean;
}) {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <section>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="public-title text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">AI Tools</h1>
          <p className="public-muted mt-1 text-sm text-zinc-500 dark:text-zinc-400">Find useful products, partners, and workflows for modern teams.</p>
        </div>
        <button
          onClick={onAddTool}
          className="inline-flex w-fit items-center gap-2 rounded-md bg-[#4f63d8] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#4054c9]"
        >
          <Plus className="h-4 w-4" />
          {isAdmin ? "Add tools" : "Submit tool"}
        </button>
      </div>
      <div className="public-divider mt-6 flex flex-col gap-4 border-b border-zinc-200 py-5 lg:flex-row lg:items-center lg:justify-between dark:border-zinc-800">
        <div className="relative w-full lg:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search tools..."
            className="public-control h-10 w-full rounded-md border border-zinc-200 bg-white pl-9 pr-9 text-sm text-zinc-950 shadow-sm placeholder:text-zinc-400 focus:border-[#4f63d8] focus:outline-none focus:ring-2 focus:ring-[#4f63d8]/15 dark:border-zinc-800 dark:bg-[#181a20] dark:text-zinc-50 dark:placeholder:text-zinc-500"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="relative z-20 flex items-center gap-2">
          <label htmlFor="category-filter" className="sr-only">
            Category
          </label>
          <select
            id="category-filter"
            value={selectedCategory}
            onChange={(event) => onSelectCategory(event.target.value)}
            className="public-control h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-800 shadow-sm focus:border-[#4f63d8] focus:outline-none focus:ring-2 focus:ring-[#4f63d8]/15 dark:border-zinc-800 dark:bg-[#181a20] dark:text-zinc-100"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "public-control flex h-10 items-center gap-2 rounded-md border px-3 text-sm font-medium shadow-sm transition-colors",
              showFilters || selectedTag
                ? "border-[#4f63d8] bg-indigo-50 text-[#3147bd] dark:bg-indigo-500/10 dark:text-indigo-300"
                : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-[#181a20] dark:text-zinc-200 dark:hover:bg-zinc-900"
            )}
          >
            <Filter className="h-4 w-4" />
            Tags
            {selectedTag && <span className="rounded bg-[#4f63d8] px-1.5 text-[10px] text-white">1</span>}
          </button>

          <AnimatePresence>
            {showFilters && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowFilters(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  className="public-popover absolute right-0 top-full z-20 mt-2 w-72 rounded-lg border border-zinc-200 bg-white p-4 shadow-xl dark:border-zinc-800 dark:bg-[#181a20]"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="public-title text-sm font-semibold text-zinc-950 dark:text-zinc-50">Filter by tags</h3>
                    {selectedTag && (
                      <button
                        onClick={() => {
                          onSelectTag(selectedTag);
                          setShowFilters(false);
                        }}
                        className="text-xs font-medium text-[#3147bd] hover:text-[#26389b]"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="flex max-h-[300px] flex-wrap gap-2 overflow-y-auto">
                    {tags.map((currentTag) => (
                      <button
                        key={currentTag}
                        onClick={() => {
                          onSelectTag(currentTag);
                          setShowFilters(false);
                        }}
                        className={cn(
                          "rounded-md border px-3 py-1.5 text-xs font-medium transition-all",
                          selectedTag === currentTag
                            ? "border-[#4f63d8] bg-indigo-50 text-[#3147bd] dark:bg-indigo-500/10 dark:text-indigo-300"
                            : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950 dark:border-zinc-800 dark:bg-[#181a20] dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
                        )}
                      >
                        {currentTag}
                      </button>
                    ))}
                    {tags.length === 0 && <p className="py-2 text-xs text-zinc-500 dark:text-zinc-400">No tags available.</p>}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="public-muted flex items-center justify-between py-3 text-xs text-zinc-500 dark:text-zinc-400">
        <span>{selectedCategory === "All" ? "All categories" : selectedCategory}</span>
        <span>{resultCount} listed</span>
      </div>
    </section>
  );
}

function ToolCard({
  tool,
  saved,
  onSave,
  isAdmin,
  onDelete,
}: {
  tool: Tool;
  saved: boolean;
  onSave: () => void;
  isAdmin?: boolean;
  onDelete?: () => void;
}) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="public-tool-card group relative flex min-h-[158px] flex-col justify-between overflow-hidden rounded-lg border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-[#181a20] dark:hover:border-zinc-700"
    >
      <div>
        <div className="relative flex items-start justify-between">
          <Link href={`/tool/${tool._id}`} className="block">
            <div className="public-tool-icon flex h-9 w-9 items-center justify-center rounded-md border border-zinc-200 bg-zinc-50 text-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] dark:border-zinc-700 dark:bg-zinc-900">
              <ToolLogo value={tool.logo} title={tool.title} className="h-full w-full object-contain p-1.5" />
            </div>
          </Link>
          <div className="flex items-center gap-1.5">
            {tool.featured && (
              <div className="flex items-center justify-center rounded-full bg-amber-50 p-1.5 text-amber-500 ring-1 ring-amber-200">
                <Star className="h-3 w-3 fill-current" />
              </div>
            )}
            <button
              onClick={onSave}
              className={cn(
                "rounded-md p-1.5 transition-colors",
                saved ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300" : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
              )}
            >
              <Bookmark className={cn("h-3.5 w-3.5", saved && "fill-current")} />
            </button>
          </div>
        </div>

        <Link href={`/tool/${tool._id}`} className="mt-4 block group-hover:cursor-pointer">
          <div className="flex items-center gap-2">
            <h3 className="public-title text-sm font-semibold tracking-tight text-zinc-950 transition-colors group-hover:text-indigo-600 dark:text-zinc-50 dark:group-hover:text-indigo-300">
              {tool.title}
            </h3>
            {isAdmin && tool.status && tool.status !== "online" && (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                  tool.status === "hold" ? "bg-amber-50 text-amber-600 ring-1 ring-amber-200" : "bg-red-50 text-red-600 ring-1 ring-red-200"
                )}
              >
                {tool.status}
              </span>
            )}
          </div>
          <p className="public-muted mt-1 line-clamp-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">{tool.description}</p>
        </Link>

        <div className="public-muted mt-4 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <span>{tool.category}</span>
          {tool.type && (
            <>
              <span className="h-1 w-1 rounded-full bg-zinc-300" />
              <span>{tool.type}</span>
            </>
          )}
          {tool.pricing && (
            <>
              <span className="h-1 w-1 rounded-full bg-zinc-300" />
              <span>{tool.pricing}</span>
            </>
          )}
        </div>
      </div>

      <div className="public-card-divider mt-4 flex items-center justify-end gap-3 border-t border-zinc-100 pt-3 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          {isAdmin && (
            <div className="flex gap-1">
              <Link href={`/tool/${tool._id}`} className="p-1.5 text-zinc-400 transition-colors hover:text-amber-500">
                <Pencil className="h-3.5 w-3.5" />
              </Link>
              <button onClick={onDelete} className="p-1.5 text-zinc-400 transition-colors hover:text-red-500">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          <a
            href={tool.url}
            target="_blank"
            rel="noopener noreferrer"
          className="public-secondary-button flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-[#181a20] dark:text-zinc-200 dark:hover:bg-zinc-900"
          >
            Visit
            <MoveUpRight className="h-3 w-3" />
          </a>
        </div>
      </div>
    </motion.div>
  );
}

function QuickAddModal({
  quickForm,
  setQuickForm,
  onClose,
  onSave,
  existingCategories,
  toolTypes,
  onCreateCategory,
}: {
  quickForm: { title: string; description: string; category: string; type: string };
  setQuickForm: React.Dispatch<React.SetStateAction<{ title: string; description: string; category: string; type: string }>>;
  onClose: () => void;
  onSave: () => void;
  existingCategories: string[];
  toolTypes: string[];
  onCreateCategory: (name: string) => Promise<void>;
}) {
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const handleCategoryChange = (value: string) => {
    if (value === "__add_new__") {
      setShowNewCategory(true);
      setQuickForm((f) => ({ ...f, category: "" }));
    } else {
      setShowNewCategory(false);
      setQuickForm((f) => ({ ...f, category: value }));
    }
  };

  const handleAddNewCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) return;
    await onCreateCategory(name);
    setQuickForm((f) => ({ ...f, category: name }));
    setShowNewCategory(false);
    setNewCategoryName("");
  };
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 16 }}
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-lg rounded-lg border border-zinc-200 bg-white p-6 shadow-2xl"
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-950">Add New Tool</h2>
          <button onClick={onClose} className="rounded-md p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-600">Title *</label>
            <input
              value={quickForm.title}
              onChange={(event) => setQuickForm((form) => ({ ...form, title: event.target.value }))}
              placeholder="Enter tool name..."
              className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-[#4f63d8] focus:outline-none focus:ring-2 focus:ring-[#4f63d8]/15"
              autoFocus
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-600">Description</label>
            <textarea
              value={quickForm.description}
              onChange={(event) => setQuickForm((form) => ({ ...form, description: event.target.value }))}
              placeholder="Brief description of the tool..."
              rows={4}
              className="w-full resize-none rounded-md border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-[#4f63d8] focus:outline-none focus:ring-2 focus:ring-[#4f63d8]/15"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-600">Category</label>
              {showNewCategory ? (
                <div className="flex gap-2">
                  <input
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="New category name..."
                    className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-[#4f63d8] focus:outline-none focus:ring-2 focus:ring-[#4f63d8]/15"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleAddNewCategory}
                    disabled={!newCategoryName.trim()}
                    className="inline-flex items-center gap-1 rounded-md bg-[#4f63d8] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    <Plus className="h-3 w-3" />
                    Add
                  </button>
                </div>
              ) : (
                <select
                  value={quickForm.category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-950 focus:border-[#4f63d8] focus:outline-none focus:ring-2 focus:ring-[#4f63d8]/15"
                >
                  <option value="">Select a category...</option>
                  {existingCategories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="__add_new__">+ Add new category...</option>
                </select>
              )}
              {showNewCategory && (
                <button
                  type="button"
                  onClick={() => {
                    setShowNewCategory(false);
                    setNewCategoryName("");
                  }}
                  className="mt-1.5 text-xs text-zinc-500 hover:text-zinc-700"
                >
                  Cancel new category
                </button>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-600">Type</label>
              <select
                value={quickForm.type}
                onChange={(event) => setQuickForm((form) => ({ ...form, type: event.target.value }))}
                className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-950 focus:border-[#4f63d8] focus:outline-none focus:ring-2 focus:ring-[#4f63d8]/15"
              >
                {toolTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <p className="mt-4 text-xs text-zinc-500">You can add tags, URL, and logo details after saving.</p>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button onClick={onClose} className="rounded-md px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100">
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={!quickForm.title.trim()}
            className="inline-flex items-center gap-2 rounded-md bg-[#4f63d8] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#4054c9] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Save & Continue
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="relative h-[158px] overflow-hidden rounded-lg border border-zinc-200 bg-white p-5">
          <div className="absolute inset-0 shimmer opacity-60" />
          <div className="flex items-start justify-between">
            <div className="h-9 w-9 rounded-md bg-zinc-100" />
            <div className="h-7 w-7 rounded-md bg-zinc-100" />
          </div>
          <div className="mt-5 space-y-3">
            <div className="h-4 w-3/4 rounded bg-zinc-100" />
            <div className="h-3 w-full rounded bg-zinc-100" />
            <div className="h-3 w-2/3 rounded bg-zinc-100" />
          </div>
        </div>
      ))}
    </div>
  );
}
