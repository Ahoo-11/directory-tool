"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Compass,
  Bookmark,
  Settings,
  HelpCircle,
  Sparkles,
  TrendingUp,
  Clock,
  Star,
  FolderTree,
  Inbox,
} from "lucide-react";
import cn from "classnames";
import { useAdminViewMode } from "./AdminViewModeProvider";

const mainNavItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Explore", href: "/explore", icon: Compass },
  { name: "Trending", href: "/trending", icon: TrendingUp },
  { name: "New Tools", href: "/new", icon: Clock },
  { name: "Featured", href: "/featured", icon: Star },
  { name: "Saved", href: "/saved", icon: Bookmark },
];

const bottomNavItems = [
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Help", href: "/help", icon: HelpCircle },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isAdmin } = useAdminViewMode();

  const mainItems = React.useMemo(() => {
    return [
      ...mainNavItems,
      { name: "Submissions", href: "/submissions", icon: Inbox } as const,
      ...(isAdmin ? [{ name: "Categories", href: "/categories", icon: FolderTree } as const] : []),
    ];
  }, [isAdmin]);

  return (
    <aside className="group/sidebar fixed left-0 top-0 z-40 flex h-screen w-20 flex-col overflow-hidden border-r border-zinc-200/80 bg-white/95 backdrop-blur-xl transition-[width] duration-200 ease-out hover:w-64 dark:border-white/5 dark:bg-[#0A0A0C]/95">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-zinc-200/80 px-[21px] dark:border-white/5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-sm shadow-lg shadow-indigo-500/25">
          AI
        </div>
        <div className="flex min-w-max flex-col opacity-0 transition-opacity duration-150 group-hover/sidebar:opacity-100">
          <span className="text-sm font-semibold text-zinc-900 dark:text-white">AI Tools</span>
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider dark:text-slate-500">Directory</span>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {mainItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                title={item.name}
                className={cn(
                  "flex items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"
                )}
              >
                <item.icon className={cn("h-5 w-5 shrink-0", isActive ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-400 dark:text-slate-400")} />
                <span className="min-w-max opacity-0 transition-opacity duration-150 group-hover/sidebar:opacity-100">
                  {item.name}
                </span>
                {isActive && (
                  <div className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-600 opacity-0 transition-opacity duration-150 group-hover/sidebar:opacity-100 dark:bg-indigo-400" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Categories Section */}
        <div className="mt-8">
          <h3 className="mb-3 min-w-max px-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 opacity-0 transition-opacity duration-150 group-hover/sidebar:opacity-100 dark:text-slate-600">
            Categories
          </h3>
          <div className="space-y-1">
            {["Copywriting", "Coding", "Image Gen", "Audio", "Analytics"].map((cat) => (
              <Link
                key={cat}
                href={`/?category=${encodeURIComponent(cat)}`}
                title={cat}
                className="flex items-center gap-3 overflow-hidden rounded-xl px-3 py-2 text-sm text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-950 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"
              >
                <Sparkles className="h-4 w-4 shrink-0 opacity-50 text-zinc-400 dark:text-slate-400" />
                <span className="min-w-max opacity-0 transition-opacity duration-150 group-hover/sidebar:opacity-100">
                  {cat}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Bottom Navigation */}
      <div className="border-t border-zinc-200/80 px-3 py-4 dark:border-white/5">
        <div className="space-y-1">
          {bottomNavItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              title={item.name}
              className="flex items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-950 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"
            >
              <item.icon className="h-5 w-5 shrink-0 text-zinc-400 dark:text-slate-400" />
              <span className="min-w-max opacity-0 transition-opacity duration-150 group-hover/sidebar:opacity-100">
                {item.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}
