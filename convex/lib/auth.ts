import type { UserIdentity } from "convex/server";

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
