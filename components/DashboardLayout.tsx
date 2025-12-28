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
    <div className="min-h-screen bg-[#0A0A0C]">
      {/* Sidebar - only for logged in users */}
      {isLoggedIn && <Sidebar />}

      {/* Main Content Area */}
      <div className={isLoggedIn ? "pl-64" : ""}>
        {/* Top Bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/5 bg-[#0A0A0C]/80 px-6 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            {/* Logo for non-logged in users */}
            {!isLoggedIn && (
              <Link href="/" className="flex items-center gap-3 mr-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25 group">
                  <div className="relative">
                    <span className="font-bold text-xl tracking-tighter">A</span>
                    <TrendingUp className="absolute -top-1 -right-2.5 h-3.5 w-3.5 text-cyan-300 stroke-[3px]" />
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-base font-bold text-white tracking-tight">Antigravity</span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Directory</span>
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
            <button className="hidden sm:flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10 transition-colors border border-white/5">
              <Plus className="h-4 w-4" />
              Submit Tool
            </button>

            {/* Theme Toggle */}
            {mounted && (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
              >
                {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
            )}

            {!user ? (
              <a
                href={stackClientApp.urls.signIn}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-transform hover:scale-105 active:scale-95"
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
