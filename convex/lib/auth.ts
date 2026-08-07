import type { UserIdentity } from "convex/server";
import { createHash } from "crypto";
import type { ActionCtx } from "../_generated/server";
import { internal } from "../_generated/api";

export const ADMIN_EMAIL = "ahoo11official@gmail.com";

export type Actor = {
  type: "human" | "integration" | "system";
  id: string;
  name?: string;
  email?: string;
};

export function assertAdmin(identity: UserIdentity | null): Actor {
  const email = identity?.email?.toLowerCase();
  if (!identity || email !== ADMIN_EMAIL) {
    throw new Error("Admin access required");
  }

  return {
    type: "human",
    id: identity.tokenIdentifier,
    name: identity.name,
    email: identity.email,
  };
}

export function assertAuthenticated(identity: UserIdentity | null): Actor {
  if (!identity) {
    throw new Error("Sign in is required");
  }

  return {
    type: "human",
    id: identity.tokenIdentifier,
    name: identity.name,
    email: identity.email,
  };
}

export function authenticateIntegration(apiKey: string): Actor {
  const configuredKeys = process.env.DIRECTORY_MCP_API_KEYS;
  if (configuredKeys) {
    try {
      const keys = JSON.parse(configuredKeys) as Record<string, string>;
      const match = Object.entries(keys).find(([, secret]) => secret === apiKey);
      if (match) {
        return { type: "integration", id: match[0], name: match[0] };
      }
    } catch {
      throw new Error("DIRECTORY_MCP_API_KEYS must be a JSON object");
    }
  }

  const singleKey = process.env.DIRECTORY_MCP_API_KEY;
  if (singleKey && singleKey === apiKey) {
    return { type: "integration", id: "mcp-default", name: "Default MCP client" };
  }

  throw new Error("Invalid integration API key");
}

export async function authenticateMcpKey(ctx: ActionCtx, apiKey: string): Promise<Actor | null> {
  const keyHash = createHash("sha256").update(apiKey).digest("hex");
  const key = await ctx.runQuery(internal.mcpKeys.lookupApiKeyByHash, { keyHash });
  if (!key) return null;

  return {
    type: "integration",
    id: key.ownerUserId,
    name: key.ownerName,
  };
}
