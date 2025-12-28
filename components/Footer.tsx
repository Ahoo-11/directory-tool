import React from "react";
import { Filter } from "lucide-react";

export function Footer() {
    return (
        <footer className="mt-20 border-t border-white/5 py-12 text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
                <Filter className="h-4 w-4 opacity-50" />
                <span>Real-time powered by Convex</span>
            </div>
        </footer>
    );
}
