import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  tools: defineTable({
    title: v.string(),
    description: v.string(),
    category: v.string(),
    type: v.optional(v.string()),
    tags: v.array(v.string()),
    url: v.string(),
    logo: v.string(),
    featured: v.boolean(),
    status: v.optional(v.union(v.literal("online"), v.literal("offline"), v.literal("hold"))),
    pricing: v.optional(v.string()),
    canonicalUrl: v.optional(v.string()),
    domain: v.optional(v.string()),
    ownerUserId: v.optional(v.string()),
    ownerType: v.optional(v.union(v.literal("human"), v.literal("integration"), v.literal("system"))),
    ownerId: v.optional(v.string()),
    publishedFromSubmissionId: v.optional(v.id("submissions")),
  })
    .index("by_category", ["category"])
    .index("by_featured", ["featured"])
    .index("by_status", ["status"])
    .index("by_canonical_url", ["canonicalUrl"]),

  submissions: defineTable({
    kind: v.union(v.literal("create"), v.literal("update"), v.literal("claim")),
    status: v.union(
      v.literal("pending"),
      v.literal("needs_changes"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("duplicate"),
    ),
    source: v.union(
      v.literal("web"),
      v.literal("mcp"),
      v.literal("api"),
      v.literal("crawler"),
      v.literal("csv"),
      v.literal("admin"),
    ),
    submittedByType: v.union(v.literal("human"), v.literal("integration"), v.literal("system")),
    submittedById: v.string(),
    submittedByName: v.optional(v.string()),
    submittedByEmail: v.optional(v.string()),
    sourceUrl: v.string(),
    canonicalUrl: v.string(),
    targetToolId: v.optional(v.id("tools")),
    title: v.string(),
    description: v.string(),
    category: v.string(),
    type: v.optional(v.string()),
    tags: v.array(v.string()),
    url: v.string(),
    logo: v.string(),
    pricing: v.optional(v.string()),
    screenshotUrl: v.optional(v.string()),
    socialLinks: v.array(
      v.object({
        platform: v.string(),
        url: v.string(),
      }),
    ),
    notes: v.optional(v.string()),
    sourceExcerpt: v.optional(v.string()),
    rawPayload: v.optional(v.string()),
    extractionMethod: v.union(v.literal("firecrawl"), v.literal("metadata"), v.literal("submitted")),
    urlReachable: v.boolean(),
    duplicateToolId: v.optional(v.id("tools")),
    duplicateSubmissionId: v.optional(v.id("submissions")),
    warnings: v.array(v.string()),
    reviewedById: v.optional(v.string()),
    reviewedByName: v.optional(v.string()),
    reviewedByEmail: v.optional(v.string()),
    reviewedAt: v.optional(v.number()),
    reviewNote: v.optional(v.string()),
    publishedToolId: v.optional(v.id("tools")),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_canonical_url", ["canonicalUrl"])
    .index("by_submitter", ["submittedById"])
    .index("by_submitter_and_status", ["submittedById", "status"]),

  auditEvents: defineTable({
    entityType: v.union(v.literal("submission"), v.literal("tool")),
    entityId: v.string(),
    action: v.string(),
    actorType: v.union(v.literal("human"), v.literal("integration"), v.literal("system")),
    actorId: v.string(),
    actorName: v.optional(v.string()),
    actorEmail: v.optional(v.string()),
    metadata: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_entity", ["entityType", "entityId"])
    .index("by_actor", ["actorId"]),

  categories: defineTable({
    name: v.string(),
    parentId: v.optional(v.id("categories")),
    x: v.optional(v.number()),
    y: v.optional(v.number()),
  })
    .index("by_parent", ["parentId"])
    .index("by_name", ["name"]),
});
