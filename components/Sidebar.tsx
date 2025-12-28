"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@stackframe/stack";
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
} from "lucide-react";
import cn from "classnames";

const ADMIN_EMAIL = "ahoo11official@gmail.com";

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
  const user = useUser();
  const isAdmin = user?.primaryEmail?.toLowerCase() === ADMIN_EMAIL;

  const mainItems = React.useMemo(() => {
    return [
      ...mainNavItems,
      ...(isAdmin ? [{ name: "Categories", href: "/categories", icon: FolderTree } as const] : []),
    ];
  }, [isAdmin]);

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-white/5 bg-[#0A0A0C]/95 backdrop-blur-xl flex flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-white/5 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-sm shadow-lg shadow-indigo-500/25">
          AI
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-white">AI Tools</span>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">Directory</span>
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
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-indigo-500/10 text-indigo-400 shadow-sm"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive && "text-indigo-400")} />
                {item.name}
                {isActive && (
                  <div className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-400" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Categories Section */}
        <div className="mt-8">
          <h3 className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
            Categories
          </h3>
          <div className="space-y-1">
            {["Copywriting", "Coding", "Image Gen", "Audio", "Analytics"].map((cat) => (
              <Link
                key={cat}
                href={`/?category=${encodeURIComponent(cat)}`}
                className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-400 transition-all hover:bg-white/5 hover:text-white"
              >
                <Sparkles className="h-4 w-4 opacity-50" />
                {cat}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Bottom Navigation */}
      <div className="border-t border-white/5 px-3 py-4">
        <div className="space-y-1">
          {bottomNavItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition-all hover:bg-white/5 hover:text-white"
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}
