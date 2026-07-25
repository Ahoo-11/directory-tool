"use client";

import React from "react";
import { useAction } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Globe2, LoaderCircle, Sparkles, X } from "lucide-react";
import { api } from "@/convex/_generated/api";

export function SubmitToolModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const submitListing = useAction(api.submissions.submitListing);
  const [url, setUrl] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");
  const [result, setResult] = React.useState<{
    submissionId: string;
    title: string;
    status: "pending" | "duplicate";
    warnings: string[];
  } | null>(null);

  const close = () => {
    if (submitting) return;
    setUrl("");
    setNotes("");
    setError("");
    setResult(null);
    onClose();
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!url.trim() || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const response = await submitListing({
        url: url.trim(),
        notes: notes.trim() || undefined,
      });
      setResult({
        submissionId: response.submissionId,
        title: response.title,
        status: response.status === "duplicate" ? "duplicate" : "pending",
        warnings: response.warnings,
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not submit this website");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/45 p-4 backdrop-blur-sm"
          onClick={close}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-[#181a20]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-wide">Automatic import</span>
                </div>
                <h2 className="mt-2 text-xl font-semibold text-zinc-950 dark:text-white">Submit a tool</h2>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  Enter the official website. We’ll extract the listing details for review.
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                className="rounded-md p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {result ? (
              <div className="mt-6">
                <div
                  className={
                    result.status === "duplicate"
                      ? "rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200"
                      : "rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200"
                  }
                >
                  <div className="flex items-start gap-3">
                    {result.status === "duplicate" ? (
                      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                    ) : (
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                    )}
                    <div>
                      <p className="font-semibold">
                        {result.status === "duplicate" ? "Possible duplicate sent for review" : `${result.title} is in the review queue`}
                      </p>
                      <p className="mt-1 text-xs opacity-80">Submission ID: {result.submissionId}</p>
                    </div>
                  </div>
                </div>
                {result.warnings.length > 0 && (
                  <div className="mt-3 rounded-lg bg-zinc-50 p-3 text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
                    {result.warnings.join(" · ")}
                  </div>
                )}
                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={close}
                    className="rounded-md bg-[#4f63d8] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4054c9]"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={submit} className="mt-6 space-y-4">
                <div>
                  <label htmlFor="submission-url" className="mb-1.5 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Official website URL
                  </label>
                  <div className="relative">
                    <Globe2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                    <input
                      id="submission-url"
                      value={url}
                      onChange={(event) => setUrl(event.target.value)}
                      placeholder="https://example.com"
                      autoFocus
                      className="h-11 w-full rounded-md border border-zinc-200 bg-white pl-10 pr-3 text-sm text-zinc-950 outline-none focus:border-[#4f63d8] focus:ring-2 focus:ring-[#4f63d8]/15 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="submission-notes" className="mb-1.5 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Notes for the reviewer <span className="font-normal text-zinc-400">(optional)</span>
                  </label>
                  <textarea
                    id="submission-notes"
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    rows={3}
                    placeholder="Ownership context, launch details, or anything we should know..."
                    className="w-full resize-none rounded-md border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-950 outline-none focus:border-[#4f63d8] focus:ring-2 focus:ring-[#4f63d8]/15 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                  />
                </div>
                {error && (
                  <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                    {error}
                  </div>
                )}
                <div className="flex items-center justify-between gap-4 pt-2">
                  <p className="text-xs text-zinc-500">Nothing is published until an administrator approves it.</p>
                  <button
                    type="submit"
                    disabled={!url.trim() || submitting}
                    className="inline-flex shrink-0 items-center gap-2 rounded-md bg-[#4f63d8] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4054c9] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    {submitting ? "Importing…" : "Import & submit"}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
