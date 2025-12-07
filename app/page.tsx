"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { Bookmark, MoveUpRight, Sparkles, Star, ArrowUp, Search } from "lucide-react";
import { api } from "../convex/_generated/api";

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
};

const baseCategories = ["All", "Copywriting", "Coding", "Image Gen", "Audio", "Analytics", "Productivity"];

export default function Home() {
  const [category, setCategory] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [magnetic, setMagnetic] = useState({ x: 0, y: 0 });

  const seedTools = useMutation(api.myFunctions.seedTools);
  const upvoteTool = useMutation(api.myFunctions.upvoteTool);

  const data = useQuery(api.myFunctions.listTools, {
    category,
    search: search.trim() || undefined,
  });

  useEffect(() => {
    void seedTools({});
  }, [seedTools]);

  const { scrollY } = useScroll();
  const floatingY = useTransform(scrollY, [0, 400], [0, -16]);

  const tools = data?.tools ?? [];
  const featured = data?.featured ?? null;

  const categories = useMemo(() => {
    const fromData = Array.from(new Set((data?.tools ?? []).map((t) => t.category)));
    return Array.from(new Set([...baseCategories, ...fromData]));
  }, [data?.tools]);

  const handleSave = (id: string) => {
    setSaved((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleUpvote = async (id: string) => {
    try {
      await upvoteTool({ toolId: id as any });
    } catch (error) {
      console.error(error);
    }
  };

  const handleMagneticMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - (rect.left + rect.width / 2);
    const y = e.clientY - (rect.top + rect.height / 2);
    setMagnetic({ x: x * 0.08, y: y * 0.08 });
  };

  const clearMagnetic = () => setMagnetic({ x: 0, y: 0 });

  const loading = !data;

  return (
    <div className="relative min-h-screen text-white overflow-hidden">
      <RadialGlow />
      <header className="sticky top-0 z-30 backdrop-blur-lg bg-black/40 border-b border-white/5">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-cyan-500 text-lg font-semibold shadow-lg shadow-fuchsia-500/30">
              AI
            </div>
            <div>
              <p className="text-sm text-white/60">Powered by Convex</p>
              <p className="text-base font-semibold">Directory</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm text-white/60">
            <span className="hidden sm:flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
              <Sparkles className="h-4 w-4 text-fuchsia-300" />
              Live syncing via Convex
            </span>
            <a
              href="https://www.convex.dev"
              className="rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-500 px-4 py-2 text-sm font-semibold shadow-lg shadow-fuchsia-500/30"
            >
              Convex.dev
            </a>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl px-4 pb-24 pt-10">
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl shadow-fuchsia-500/10">
          <div className="pointer-events-none absolute inset-0 opacity-60">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(147,84,255,0.3),transparent_35%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(0,200,255,0.25),transparent_35%)]" />
          </div>
          <div className="relative grid gap-8 lg:grid-cols-2">
            <div className="flex flex-col gap-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-white/80 backdrop-blur">
                <Sparkles className="h-4 w-4 text-fuchsia-300" />
                Next.js + Tailwind + Framer Motion + Convex
              </div>
              <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
                Discover the Future of AI
              </h1>
              <p className="max-w-xl text-lg text-white/70">
                A bento-style directory of the most dazzling AI products. Filter, hover, save, and upvote your favorites in real time.
              </p>
              <div className="flex flex-wrap gap-3 text-sm text-white/60">
                <Badge>Glowing gradients</Badge>
                <Badge>Glass cards</Badge>
                <Badge>Micro-interactions</Badge>
              </div>
            </div>
            <motion.div
              style={{ y: floatingY }}
              onMouseMove={handleMagneticMove}
              onMouseLeave={clearMagnetic}
              animate={{ x: magnetic.x, y: magnetic.y }}
              transition={{ type: "spring", stiffness: 200, damping: 16 }}
              className="relative rounded-2xl border border-white/10 bg-black/40 p-4 shadow-2xl shadow-cyan-500/20"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/20 via-transparent to-cyan-400/20 blur-3xl" />
              <div className="relative flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 shadow-inner">
                <Search className="h-5 w-5 text-fuchsia-200" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search AI tools, e.g. 'copy', 'vision', 'ops'"
                  className="w-full bg-transparent text-base text-white placeholder:text-white/50 focus:outline-none"
                />
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70">⌘K</span>
              </div>
              <p className="mt-3 text-sm text-white/60">Floating, magnetic search follows your scroll.</p>
            </motion.div>
          </div>
        </section>

        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white/80">Explore by category</h2>
            <span className="text-sm text-white/50">{tools.length} tools</span>
          </div>
          <div className="mt-4 flex snap-x gap-3 overflow-x-auto pb-3">
            {categories.map((cat) => {
              const active = cat === category;
              return (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`group relative flex-shrink-0 snap-start rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                    active ? "text-white" : "text-white/70 hover:text-white"
                  }`}
                >
                  <span
                    className={`absolute inset-0 rounded-full blur-xl transition ${
                      active ? "bg-gradient-to-r from-fuchsia-500/50 to-cyan-400/50 opacity-80" : "opacity-0"
                    }`}
                  />
                  <span className="relative flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 backdrop-blur group-hover:border-fuchsia-400/40">
                    <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-fuchsia-400 to-cyan-400" />
                    {cat}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <FeaturedSection featured={featured} loading={loading} onUpvote={handleUpvote} saved={saved} onSave={handleSave} />

        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white/80">Spotlight grid</h2>
            <div className="text-sm text-white/60">Bento layout with hover shimmer</div>
          </div>

          {loading ? (
            <SkeletonGrid />
          ) : (
            <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {tools.map((tool, idx) => (
                <ToolCard
                  key={tool._id}
                  tool={tool}
                  layout={gridClass(idx)}
                  saved={saved.has(tool._id)}
                  onSave={() => handleSave(tool._id)}
                  onUpvote={() => handleUpvote(tool._id)}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function RadialGlow() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10">
      <div className="absolute left-1/2 top-[-10%] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-fuchsia-600/20 blur-[140px]" />
      <div className="absolute right-[15%] top-[20%] h-[320px] w-[320px] rounded-full bg-cyan-500/15 blur-[120px]" />
      <div className="absolute left-[5%] bottom-[10%] h-[280px] w-[280px] rounded-full bg-indigo-500/15 blur-[120px]" />
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-white/70 backdrop-blur">
      {children}
    </span>
  );
}

function FeaturedSection({
  featured,
  loading,
  onUpvote,
  saved,
  onSave,
}: {
  featured: Tool | null;
  loading: boolean;
  onUpvote: (id: string) => void;
  saved: Set<string>;
  onSave: (id: string) => void;
}) {
  return (
    <section className="mt-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-amber-300" />
          <h2 className="text-lg font-semibold text-white/80">Tool of the Week</h2>
        </div>
        <span className="text-sm text-white/60">Carousel-style feature</span>
      </div>
      <div className="mt-4">
        {loading ? (
          <div className="h-56 w-full rounded-2xl border border-white/10 bg-white/5 shimmer" />
        ) : featured ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={featured._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-black/40 p-6 shadow-2xl"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.08),transparent_40%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_30%,rgba(0,255,245,0.08),transparent_40%)]" />
              <div className="relative grid gap-6 lg:grid-cols-[1fr,260px]">
                <div className="flex flex-col gap-3">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs text-white/70">
                    Featured · {featured.category}
                  </div>
                  <h3 className="text-2xl font-semibold">{featured.title}</h3>
                  <p className="text-white/70">{featured.description}</p>
                  <div className="flex flex-wrap gap-2 text-xs text-white/70">
                    {featured.tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-white/10 px-3 py-1">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-500 px-4 py-2 text-sm font-semibold shadow-lg shadow-fuchsia-500/30 transition hover:scale-[1.02]"
                      onClick={() => onUpvote(featured._id)}
                    >
                      <ArrowUp className="h-4 w-4" />
                      Upvote ({featured.upvotes})
                    </button>
                    <a
                      href={featured.url}
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-fuchsia-400/50"
                    >
                      Visit
                      <MoveUpRight className="h-4 w-4" />
                    </a>
                    <button
                      onClick={() => onSave(featured._id)}
                      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                        saved.has(featured._id)
                          ? "border-amber-300/60 bg-amber-200/10 text-amber-100"
                          : "border-white/10 bg-white/5 text-white/70 hover:border-fuchsia-300/50"
                      }`}
                    >
                      <Bookmark className="h-4 w-4" />
                      {saved.has(featured._id) ? "Saved" : "Save"}
                    </button>
                  </div>
                </div>
                <div className="relative flex items-center justify-center">
                  <div className="relative flex h-44 w-full items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/30 shadow-inner">
                    <div className="absolute inset-0 shimmer opacity-40" />
                    <div className="relative flex h-28 w-28 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 via-cyan-400 to-blue-500 text-4xl shadow-xl shadow-cyan-500/30">
                      {featured.logo}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/60">
            No featured tool yet.
          </div>
        )}
      </div>
    </section>
  );
}

function gridClass(idx: number) {
  const mod = idx % 6;
  if (mod === 0) return "md:col-span-2";
  if (mod === 1) return "lg:row-span-2";
  if (mod === 2) return "md:col-span-2";
  return "";
}

function ToolCard({
  tool,
  layout,
  saved,
  onSave,
  onUpvote,
}: {
  tool: Tool;
  layout?: string;
  saved: boolean;
  onSave: () => void;
  onUpvote: () => void;
}) {
  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ duration: 0.2 }}
      className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-fuchsia-500/10 ${layout ?? ""}`}
    >
      <div className="absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(147,84,255,0.18),transparent_35%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_30%,rgba(0,255,245,0.18),transparent_35%)]" />
      </div>
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500/20 to-cyan-400/20 text-2xl">
            {tool.logo}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{tool.title}</h3>
            <p className="text-xs text-white/50">{tool.category}</p>
          </div>
        </div>
        <button
          onClick={onSave}
          className={`rounded-full border px-2 py-2 transition ${
            saved ? "border-amber-300/60 bg-amber-200/10 text-amber-100" : "border-white/10 bg-white/5 text-white/60 hover:border-fuchsia-300/50"
          }`}
        >
          <Bookmark className="h-4 w-4" />
        </button>
      </div>
      <p className="mt-3 text-sm text-white/70 line-clamp-2">{tool.description}</p>
      <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-white/70">
        {tool.tags.map((tag) => (
          <span key={tag} className="rounded-full bg-white/10 px-2 py-1">
            {tag}
          </span>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={onUpvote}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 transition hover:border-fuchsia-400/50"
        >
          <ArrowUp className="h-4 w-4" />
          Upvote {tool.upvotes}
        </button>
        <a
          href={tool.url}
          className="inline-flex items-center gap-1 text-sm font-semibold text-white hover:text-fuchsia-200"
        >
          Visit
          <MoveUpRight className="h-4 w-4" />
        </a>
      </div>
    </motion.div>
  );
}

function SkeletonGrid() {
  return (
    <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, idx) => (
        <div key={idx} className={`relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 ${gridClass(idx)}`}>
          <div className="absolute inset-0 shimmer opacity-30" />
          <div className="relative flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-white/10" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 rounded bg-white/10" />
              <div className="h-3 w-20 rounded bg-white/10" />
            </div>
          </div>
          <div className="mt-4 h-12 w-full rounded bg-white/10" />
          <div className="mt-4 flex gap-2">
            <div className="h-6 w-16 rounded-full bg-white/10" />
            <div className="h-6 w-14 rounded-full bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  );
}
