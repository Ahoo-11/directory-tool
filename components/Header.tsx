"use client";

import React from "react";
import { ChevronRight } from "lucide-react";
import { UserButton, useUser } from "@stackframe/stack";
import { stackClientApp } from "@/stack/client";
import Link from "next/link";

export function Header({ user }: { user: ReturnType<typeof useUser> }) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0A0A0C]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1400px] h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center justify-center h-8 w-8 rounded-lg bg-indigo-600 text-white font-bold text-lg shadow-lg shadow-indigo-500/20">
                AI
            </Link>
            <div className="hidden md:flex items-center text-sm">
                <span className="text-slate-400 font-medium">Solution Partners</span>
                <ChevronRight className="h-4 w-4 mx-2 text-slate-600" />
                <span className="text-white font-semibold">Directory</span>
            </div>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
          <a className="hover:text-white transition-colors" href="#">Product</a>
          <a className="hover:text-white transition-colors" href="#">Resources</a>
          <a className="hover:text-white transition-colors" href="#">Docs</a>
          <a className="hover:text-white transition-colors" href="#">Pricing</a>
        </nav>

        <div className="flex items-center gap-3">
          {!user ? (
            <div className="flex items-center rounded-full border border-white/10 bg-white/5 p-1 pr-4 pl-1">
                <a
                href={stackClientApp.urls.signIn}
                className="rounded-full bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-transform hover:scale-105 active:scale-95"
                >
                Get Started
                </a>
                <a
                href={stackClientApp.urls.signIn}
                className="ml-3 text-sm font-medium text-slate-300 hover:text-white"
                >
                Log in
                </a>
            </div>
          ) : (
            <UserButton showUserInfo={false} />
          )}
        </div>
      </div>
    </header>
  );
}
