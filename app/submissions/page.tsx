"use client";

import React from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { useUser } from "@stackframe/stack";
import {
  AlertTriangle,
  Check,
  Clock3,
  ExternalLink,
  Inbox,
  LoaderCircle,
  MessageSquareText,
  Plus,
  RotateCcw,
  X,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { DashboardLayout } from "@/components/DashboardLayout";
import { SubmitToolModal } from "@/components/SubmitToolModal";
import { stackClientApp } from "@/stack/client";
import { useAdminViewMode } from "@/components/AdminViewModeProvider";

type SubmissionStatus = Doc<"submissions">["status"];

const statusStyles: Record<SubmissionStatus, string> = {
  pending: "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-900",
  duplicate: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900",
  needs_changes: "bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:ring-violet-900",
  approved: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900",
  rejected: "bg-red-50 text-red-700 ring-red-200 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-900",
};

function statusLabel(status: SubmissionStatus) {
  return status.replace("_", " ");
}

export default function SubmissionsPage() {
  const user = useUser();
  const { isAdmin } = useAdminViewMode();
  const [filter, setFilter] = React.useState<SubmissionStatus | "all">("all");
  const [showSubmit, setShowSubmit] = React.useState(false);
  const [busyId, setBusyId] = React.useState<Id<"submissions"> | null>(null);
  const [error, setError] = React.useState("");
  const reviewSubmission = useMutation(api.submissions.reviewSubmission);
  const adminSubmissions = useQuery(
    api.submissions.listSubmissionsAdmin,
    user && isAdmin ? { status: filter === "all" ? undefined : filter } : "skip",
  );
  const mySubmissions = useQuery(api.submissions.listMySubmissions, user && !isAdmin ? {} : "skip");
  const submissions = isAdmin ? adminSubmissions : mySubmissions;

  const review = async (
    submissionId: Id<"submissions">,
    decision: "approve" | "reject" | "needs_changes",
  ) => {
    let note: string | undefined;
    if (decision !== "approve") {
      const response = window.prompt(
        decision === "reject" ? "Why is this being rejected?" : "What needs to change?",
      );
      if (response === null) return;
      note = response.trim() || undefined;
    }

    setBusyId(submissionId);
    setError("");
    try {
      await reviewSubmission({ submissionId, decision, note });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Review action failed");
    } finally {
      setBusyId(null);
    }
  };

  if (!user) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-xl px-6 py-20 text-center">
          <Inbox className="mx-auto h-10 w-10 text-zinc-300" />
          <h1 className="mt-4 text-2xl font-semibold text-zinc-950 dark:text-white">Sign in to view submissions</h1>
          <a
            href={stackClientApp.urls.signIn}
            className="mt-6 inline-flex rounded-md bg-[#4f63d8] px-4 py-2 text-sm font-semibold text-white"
          >
            Sign in
          </a>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
              {isAdmin ? "Moderation" : "Your activity"}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white">
              {isAdmin ? "Submission review queue" : "My submissions"}
            </h1>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              {isAdmin
                ? "Review provenance, extracted evidence, and duplicates before publishing."
                : "Track every listing you submitted and its review status."}
            </p>
          </div>
          {!isAdmin && (
            <button
              type="button"
              onClick={() => setShowSubmit(true)}
              className="inline-flex w-fit items-center gap-2 rounded-md bg-[#4f63d8] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4054c9]"
            >
              <Plus className="h-4 w-4" />
              Submit a tool
            </button>
          )}
        </div>

        {isAdmin && (
          <div className="mt-7 flex flex-wrap gap-2">
            {(["all", "pending", "duplicate", "needs_changes", "approved", "rejected"] as const).map((status) => (
              <button
                type="button"
                key={status}
                onClick={() => setFilter(status)}
                className={
                  filter === status
                    ? "rounded-full bg-zinc-950 px-3 py-1.5 text-xs font-semibold capitalize text-white dark:bg-white dark:text-zinc-950"
                    : "rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium capitalize text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                }
              >
                {status.replace("_", " ")}
              </button>
            ))}
          </div>
        )}

        {error && (
          <div className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </div>
        )}

        {submissions === undefined ? (
          <div className="flex min-h-64 items-center justify-center">
            <LoaderCircle className="h-6 w-6 animate-spin text-indigo-500" />
          </div>
        ) : submissions.length === 0 ? (
          <div className="mt-10 rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center dark:border-zinc-800 dark:bg-[#181a20]">
            <Inbox className="mx-auto h-9 w-9 text-zinc-300 dark:text-zinc-700" />
            <h2 className="mt-4 font-semibold text-zinc-900 dark:text-white">Nothing here yet</h2>
            <p className="mt-1 text-sm text-zinc-500">
              {isAdmin ? "New submissions will appear here." : "Submit a website and its status will appear here."}
            </p>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {submissions.map((submission) => (
              <SubmissionCard
                key={submission._id}
                submission={submission}
                isAdmin={isAdmin}
                busy={busyId === submission._id}
                onReview={(decision) => review(submission._id, decision)}
              />
            ))}
          </div>
        )}
      </div>
      <SubmitToolModal open={showSubmit} onClose={() => setShowSubmit(false)} />
    </DashboardLayout>
  );
}

function SubmissionCard({
  submission,
  isAdmin,
  busy,
  onReview,
}: {
  submission: Doc<"submissions">;
  isAdmin: boolean;
  busy: boolean;
  onReview: (decision: "approve" | "reject" | "needs_changes") => void;
}) {
  const currentTool = useQuery(
    api.myFunctions.getTool,
    submission.kind === "update" && submission.targetToolId
      ? { toolId: submission.targetToolId }
      : "skip",
  );
  const reviewable =
    isAdmin && !["approved", "rejected"].includes(submission.status);

  return (
    <article className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-[#181a20]">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ring-1 ring-inset ${statusStyles[submission.status]}`}>
              {statusLabel(submission.status)}
            </span>
            <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              {submission.kind}
            </span>
            <span className="text-xs text-zinc-400">
              {new Date(submission._creationTime).toLocaleString()}
            </span>
          </div>

          <div className="mt-4 flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 text-lg dark:border-zinc-700 dark:bg-zinc-900">
              {/^https?:\/\//i.test(submission.logo) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={submission.logo} alt="" className="h-full w-full object-contain p-1.5" />
              ) : (
                submission.logo || submission.title.slice(0, 1)
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-zinc-950 dark:text-white">{submission.title}</h2>
              <a
                href={submission.url}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex max-w-full items-center gap-1 truncate text-xs text-indigo-600 hover:underline dark:text-indigo-400"
              >
                {submission.canonicalUrl}
                <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            </div>
          </div>

          <p className="mt-4 max-w-3xl text-sm leading-6 text-zinc-600 dark:text-zinc-300">
            {submission.description}
          </p>

          <div className="mt-4 flex flex-wrap gap-2 text-xs text-zinc-500">
            <span className="rounded bg-zinc-100 px-2 py-1 dark:bg-zinc-800">{submission.category}</span>
            {submission.type && <span className="rounded bg-zinc-100 px-2 py-1 dark:bg-zinc-800">{submission.type}</span>}
            {submission.pricing && <span className="rounded bg-zinc-100 px-2 py-1 dark:bg-zinc-800">{submission.pricing}</span>}
            {submission.tags.map((tag) => (
              <span key={tag} className="rounded bg-zinc-50 px-2 py-1 dark:bg-zinc-900">#{tag}</span>
            ))}
          </div>

          {isAdmin && submission.kind === "update" && currentTool && (
            <UpdateDiff current={currentTool} proposed={submission} />
          )}

          {isAdmin && (
            <div className="mt-5 grid gap-3 rounded-lg border border-zinc-100 bg-zinc-50 p-4 text-xs text-zinc-600 sm:grid-cols-2 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400">
              <div>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">Submitted by:</span>{" "}
                {submission.submittedByName ?? submission.submittedByEmail ?? submission.submittedById}
              </div>
              <div>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">Source:</span>{" "}
                {submission.source} · {submission.submittedByType} · {submission.extractionMethod}
              </div>
              <div>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">URL check:</span>{" "}
                {submission.urlReachable ? "reachable" : "could not be verified"}
              </div>
              <div>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">Submission ID:</span>{" "}
                {submission._id}
              </div>
            </div>
          )}

          {submission.warnings.length > 0 && (
            <div className="mt-3 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{submission.warnings.join(" · ")}</span>
            </div>
          )}

          {(submission.duplicateToolId || submission.duplicateSubmissionId) && (
            <div className="mt-3 text-xs text-amber-700 dark:text-amber-300">
              Possible duplicate:{" "}
              {submission.duplicateToolId ? (
                <Link href={`/tool/${submission.duplicateToolId}`} className="font-semibold underline">
                  existing listing
                </Link>
              ) : (
                `submission ${submission.duplicateSubmissionId}`
              )}
            </div>
          )}

          {submission.notes && (
            <div className="mt-3 flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-300">
              <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
              {submission.notes}
            </div>
          )}
          {submission.reviewNote && (
            <div className="mt-3 rounded-md bg-violet-50 px-3 py-2 text-sm text-violet-800 dark:bg-violet-950/30 dark:text-violet-300">
              Reviewer: {submission.reviewNote}
            </div>
          )}

          {isAdmin && submission.sourceExcerpt && (
            <details className="mt-4">
              <summary className="cursor-pointer text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200">
                View extracted evidence
              </summary>
              <p className="mt-2 max-h-40 overflow-y-auto rounded-md bg-zinc-50 p-3 text-xs leading-5 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                {submission.sourceExcerpt}
              </p>
            </details>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap gap-2 lg:w-44 lg:flex-col">
          {reviewable && (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={() => onReview("approve")}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Approve
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => onReview("needs_changes")}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-violet-200 px-3 py-2 text-sm font-medium text-violet-700 hover:bg-violet-50 disabled:opacity-50 dark:border-violet-900 dark:text-violet-300 dark:hover:bg-violet-950/30"
              >
                <RotateCcw className="h-4 w-4" />
                Needs changes
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => onReview("reject")}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/30"
              >
                <X className="h-4 w-4" />
                Reject
              </button>
            </>
          )}
          {!reviewable && submission.status === "pending" && (
            <div className="inline-flex items-center gap-2 text-sm text-zinc-500">
              <Clock3 className="h-4 w-4" />
              Awaiting review
            </div>
          )}
          {submission.publishedToolId && (
            <Link
              href={`/tool/${submission.publishedToolId}`}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              View listing
              <ExternalLink className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

function UpdateDiff({
  current,
  proposed,
}: {
  current: Doc<"tools">;
  proposed: Doc<"submissions">;
}) {
  const fields = [
    { label: "Title", before: current.title, after: proposed.title },
    { label: "Description", before: current.description, after: proposed.description },
    { label: "Category", before: current.category, after: proposed.category },
    { label: "Type", before: current.type, after: proposed.type },
    { label: "Tags", before: current.tags, after: proposed.tags },
    { label: "URL", before: current.url, after: proposed.url },
    { label: "Logo", before: current.logo, after: proposed.logo },
    { label: "Pricing", before: current.pricing, after: proposed.pricing },
  ].filter(({ before, after }) => JSON.stringify(before ?? null) !== JSON.stringify(after ?? null));

  const display = (value: string | string[] | undefined) => {
    if (Array.isArray(value)) return value.length ? value.join(", ") : "Empty";
    return value || "Empty";
  };

  return (
    <div className="mt-5 rounded-lg border border-indigo-200 bg-indigo-50/60 p-4 dark:border-indigo-900/70 dark:bg-indigo-950/20">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-indigo-950 dark:text-indigo-200">Pending changes</h3>
        <p className="mt-0.5 text-xs text-indigo-700 dark:text-indigo-400">
          The live tool remains unchanged until this submission is approved.
        </p>
      </div>
      {fields.length > 0 ? (
        <div className="space-y-3">
          {fields.map((field) => (
            <div
              key={field.label}
              className="grid gap-1 border-t border-indigo-100 pt-3 text-xs sm:grid-cols-[90px_1fr_1fr] sm:gap-3 dark:border-indigo-900/50"
            >
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">{field.label}</span>
              <div>
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-red-500">
                  Current
                </span>
                <p className="break-words text-zinc-500 line-through decoration-red-400 dark:text-zinc-400">
                  {display(field.before)}
                </p>
              </div>
              <div>
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-emerald-600">
                  Proposed
                </span>
                <p className="break-words font-medium text-zinc-900 dark:text-zinc-100">
                  {display(field.after)}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-zinc-500">No field differences found.</p>
      )}
    </div>
  );
}
