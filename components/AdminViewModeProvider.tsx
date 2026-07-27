"use client";

import React from "react";
import { useUser } from "@stackframe/stack";

const ADMIN_EMAIL = "ahoo11official@gmail.com";
const STORAGE_KEY = "directory-admin-view-mode";

type ViewMode = "admin" | "user";

type AdminViewModeContextValue = {
  viewMode: ViewMode;
  setViewModeState: React.Dispatch<React.SetStateAction<ViewMode>>;
};

const AdminViewModeContext = React.createContext<AdminViewModeContextValue | null>(null);

export function AdminViewModeProvider({ children }: { children: React.ReactNode }) {
  const [viewMode, setViewModeState] = React.useState<ViewMode>("admin");

  React.useEffect(() => {
    const savedMode = window.localStorage.getItem(STORAGE_KEY);
    if (savedMode === "admin" || savedMode === "user") {
      setViewModeState(savedMode);
    }
  }, []);

  const value = React.useMemo(
    () => ({
      viewMode,
      setViewModeState,
    }),
    [viewMode],
  );

  return <AdminViewModeContext.Provider value={value}>{children}</AdminViewModeContext.Provider>;
}

export function useAdminViewMode() {
  const context = React.useContext(AdminViewModeContext);
  const user = useUser();
  if (!context) {
    throw new Error("useAdminViewMode must be used inside AdminViewModeProvider");
  }

  const isActualAdmin = user?.primaryEmail?.toLowerCase() === ADMIN_EMAIL;
  const setViewMode = (mode: ViewMode) => {
    if (!isActualAdmin) return;
    context.setViewModeState(mode);
    window.localStorage.setItem(STORAGE_KEY, mode);
  };

  return {
    isActualAdmin,
    isAdmin: isActualAdmin && context.viewMode === "admin",
    viewMode: context.viewMode,
    setViewMode,
  };
}
