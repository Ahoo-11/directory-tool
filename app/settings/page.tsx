"use client";

import React from "react";
import { useUser } from "@stackframe/stack";
import { useMutation, useQuery } from "convex/react";
import { Check, Copy, KeyRound, LoaderCircle, Plus, ShieldAlert, Trash2 } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { stackClientApp } from "@/stack/client";

export default function SettingsPage() {
  const user = useUser();
  const keys = useQuery(api.mcpKeys.listMyKeys, user ? {} : "skip");
  const createApiKey = useMutation(api.mcpKeys.createApiKey);
  const revokeApiKey = useMutation(api.mcpKeys.revokeApiKey);
  const [name, setName] = React.useState("");
  const [newApiKey, setNewApiKey] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [revokingId, setRevokingId] = React.useState<Id<"mcpKeys"> | null>(null);
  const [error, setError] = React.useState("");

  const createKey = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;

    setCreating(true);
    setError("");
    setNewApiKey(null);
    setCopied(false);
    try {
      const result = await createApiKey({ name: trimmedName });
      setNewApiKey(result.apiKey);
      setName("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create API key");
    } finally {
      setCreating(false);
    }
  };

  const copyKey = async () => {
    if (!newApiKey) return;
    try {
      await navigator.clipboard.writeText(newApiKey);
      setCopied(true);
    } catch {
      setError("Could not copy the API key. Select and copy it manually.");
    }
  };

  const revokeKey = async (keyId: Id<"mcpKeys">) => {
    setRevokingId(keyId);
    setError("");
    try {
      await revokeApiKey({ keyId });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not revoke API key");
    } finally {
      setRevokingId(null);
    }
  };

  if (!user) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-xl px-6 py-20 text-center">
          <KeyRound className="mx-auto h-10 w-10 text-zinc-300" />
          <h1 className="mt-4 text-2xl font-semibold text-zinc-950 dark:text-white">
            Sign in to manage settings
          </h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Sign in to create and manage your MCP API keys.
          </p>
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
      <div className="mx-auto max-w-4xl px-6 py-10">
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
          Account
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white">
          Settings
        </h1>

        <section className="mt-8 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-[#181a20]">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-950 dark:text-white">MCP API keys</h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Create keys for MCP clients that access the directory on your behalf.
              </p>
            </div>
          </div>

          <form onSubmit={createKey} className="mt-6 flex flex-col gap-3 sm:flex-row">
            <label className="sr-only" htmlFor="key-name">Key name</label>
            <input
              id="key-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Key name, e.g. Claude Desktop"
              className="min-w-0 flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
            />
            <button
              type="submit"
              disabled={creating || !name.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-[#4f63d8] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4054c9] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {creating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Create key
            </button>
          </form>

          {error && (
            <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </div>
          )}

          {newApiKey && (
            <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/60 dark:bg-amber-950/25">
              <div className="flex gap-3">
                <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">Copy this key now</p>
                  <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                    You will not be able to see the full key again.
                  </p>
                  <div className="mt-3 flex items-center gap-2 rounded-md border border-amber-200 bg-white p-2 dark:border-amber-900 dark:bg-zinc-950">
                    <code className="min-w-0 flex-1 select-all overflow-x-auto whitespace-nowrap px-1 text-sm text-zinc-800 dark:text-zinc-200">
                      {newApiKey}
                    </code>
                    <button
                      type="button"
                      onClick={copyKey}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-950"
                    >
                      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 border-t border-zinc-200 pt-6 dark:border-zinc-800">
            {keys === undefined ? (
              <div className="flex min-h-32 items-center justify-center">
                <LoaderCircle className="h-6 w-6 animate-spin text-indigo-500" />
              </div>
            ) : keys.length === 0 ? (
              <div className="rounded-lg border border-dashed border-zinc-300 px-6 py-10 text-center dark:border-zinc-700">
                <KeyRound className="mx-auto h-8 w-8 text-zinc-300 dark:text-zinc-700" />
                <h3 className="mt-3 text-sm font-semibold text-zinc-900 dark:text-white">No API keys yet</h3>
                <p className="mt-1 text-sm text-zinc-500">Create a key to connect your first MCP client.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {keys.map((key) => (
                  <div key={key._id} className="flex flex-col gap-4 rounded-lg border border-zinc-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-zinc-950 dark:text-white">{key.name}</p>
                        {key.revoked && <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold uppercase text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">Revoked</span>}
                      </div>
                      <code className="mt-1 block text-sm text-zinc-600 dark:text-zinc-300">{key.keyPrefix}...</code>
                      <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                        Created {new Date(key.createdAt).toLocaleDateString()} · Last used {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : "Never"}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={key.revoked || revokingId === key._id}
                      onClick={() => revokeKey(key._id)}
                      className="inline-flex items-center justify-center gap-2 self-start rounded-md border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-red-900 dark:hover:bg-red-950/30 dark:hover:text-red-300"
                    >
                      {revokingId === key._id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      {key.revoked ? "Revoked" : "Revoke"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
