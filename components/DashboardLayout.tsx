"use client";

import React from "react";
import Link from "next/link";
import { Sidebar } from "./Sidebar";
import { UserButton, useUser } from "@stackframe/stack";
import { stackClientApp } from "@/stack/client";
import { Bell, Search, Sun, Moon, TrendingUp, Plus } from "lucide-react";
import { useTheme } from "next-themes";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = useUser();
  const isLoggedIn = !!user;
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className={isLoggedIn ? "min-h-screen bg-[#0A0A0C]" : "public-shell min-h-screen bg-[#f7f7f5] text-zinc-950 dark:bg-[#0f1014] dark:text-zinc-50"}>
      {/* Sidebar - only for logged in users */}
      {isLoggedIn && <Sidebar />}

      {/* Main Content Area */}
      <div className={isLoggedIn ? "pl-64" : ""}>
        {/* Top Bar */}
        <header
          className={
            isLoggedIn
              ? "sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/5 bg-[#0A0A0C]/80 px-6 backdrop-blur-xl"
              : "public-header sticky top-0 z-30 flex h-16 items-center justify-between border-b border-zinc-200 bg-[#f7f7f5]/90 px-5 backdrop-blur-xl dark:border-zinc-800 dark:bg-[#0f1014]/90"
          }
        >
          <div className="flex items-center gap-4">
            {/* Logo for non-logged in users */}
            {!isLoggedIn && (
              <Link href="/" className="flex items-center gap-3 mr-4">
                <div className="public-logo-mark flex h-8 w-8 items-center justify-center rounded-md bg-zinc-950 text-white shadow-sm group dark:bg-white dark:text-zinc-950">
                  <div className="relative">
                    <span className="font-bold text-sm tracking-tighter">A</span>
                    <TrendingUp className="absolute -top-1 -right-2 h-3 w-3 text-indigo-300 stroke-[3px]" />
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="public-title text-sm font-semibold text-zinc-950 tracking-tight dark:text-zinc-50">Antigravity</span>
                  <span className="public-muted text-[10px] text-zinc-500 uppercase tracking-wider font-medium dark:text-zinc-500">Directory</span>
                </div>
              </Link>
            )}
            {isLoggedIn && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search tools..."
                  className="h-10 w-80 rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {isLoggedIn && (
              <button className="relative rounded-xl p-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-white">
                <Bell className="h-5 w-5" />
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-indigo-500" />
              </button>
            )}

            {/* Submit Tool Button */}
            {isLoggedIn ? (
              <button className="hidden sm:flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10 transition-colors border border-white/5">
                <Plus className="h-4 w-4" />
                Submit Tool
              </button>
            ) : (
              null
            )}

            {/* Theme Toggle */}
            {mounted && (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className={
                  isLoggedIn
                    ? "rounded-xl p-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
                    : "rounded-md p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
                }
              >
                {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
            )}

            {!user ? (
              <a
                href={stackClientApp.urls.signIn}
                className="rounded-md bg-[#4f63d8] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#4054c9]"
              >
                Sign In
              </a>
            ) : (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-white">{user.displayName || "User"}</p>
                  <p className="text-xs text-slate-500">{user.primaryEmail}</p>
                </div>
                <UserButton showUserInfo={false} />
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
    </div>
  );
}
