import { createHash, randomBytes } from "crypto";
import { v } from "convex/values";
import { internalQuery, mutation, query } from "./_generated/server";

function userId(identity: { subject?: string; tokenIdentifier: string }) {
  return identity.subject ?? identity.tokenIdentifier;
}

export const listMyKeys = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("mcpKeys"),
      name: v.string(),
      keyPrefix: v.string(),
      revoked: v.boolean(),
      createdAt: v.number(),
      lastUsedAt: v.optional(v.number()),
    }),
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Sign in is required");

    const keys = await ctx.db
      .query("mcpKeys")
      .withIndex("by_owner", (q) => q.eq("ownerUserId", userId(identity)))
      .order("desc")
      .collect();

    return keys.map(({ _id, name, keyPrefix, revoked, createdAt, lastUsedAt }) => ({
      _id,
      name,
      keyPrefix,
      revoked,
      createdAt,
      lastUsedAt,
    }));
  },
});

export const createApiKey = mutation({
  args: { name: v.string() },
  returns: v.object({ apiKey: v.string(), keyId: v.id("mcpKeys") }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Sign in is required");

    const name = args.name.trim();
    if (!name) throw new Error("Key name is required");

    const apiKey = `dt_${randomBytes(32).toString("base64url")}`;
    const keyHash = createHash("sha256").update(apiKey).digest("hex");
    const keyId = await ctx.db.insert("mcpKeys", {
      name,
      keyPrefix: apiKey.slice(0, 10),
      keyHash,
      ownerUserId: userId(identity),
      ownerName: identity.name,
      revoked: false,
      createdAt: Date.now(),
    });

    return { apiKey, keyId };
  },
});

export const revokeApiKey = mutation({
  args: { keyId: v.id("mcpKeys") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Sign in is required");

    const key = await ctx.db.get(args.keyId);
    if (!key || key.ownerUserId !== userId(identity)) {
      throw new Error("MCP API key not found");
    }

    await ctx.db.patch(args.keyId, { revoked: true });
    return null;
  },
});

export const lookupApiKeyByHash = internalQuery({
  args: { keyHash: v.string() },
  returns: v.union(
    v.object({
      keyId: v.id("mcpKeys"),
      ownerUserId: v.string(),
      ownerName: v.optional(v.string()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const key = await ctx.db
      .query("mcpKeys")
      .withIndex("by_keyHash", (q) => q.eq("keyHash", args.keyHash))
      .unique();

    if (!key || key.revoked) return null;
    return { keyId: key._id, ownerUserId: key.ownerUserId, ownerName: key.ownerName };
  },
});
