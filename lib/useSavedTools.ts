"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "saved-tools";

export function useSavedTools() {
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSaved(new Set(parsed));
      }
    } catch (error) {
      console.error("Failed to load saved tools:", error);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage whenever saved changes
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(saved)));
      } catch (error) {
        console.error("Failed to save tools:", error);
      }
    }
  }, [saved, isLoaded]);

  const toggleSaved = useCallback((id: string) => {
    setSaved((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const isSaved = useCallback((id: string) => saved.has(id), [saved]);

  const getSavedIds = useCallback(() => Array.from(saved), [saved]);

  return {
    saved,
    isLoaded,
    toggleSaved,
    isSaved,
    getSavedIds,
  };
}
