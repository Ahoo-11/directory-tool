import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  tools: defineTable({
    title: v.string(),
    description: v.string(),
    category: v.string(),
    tags: v.array(v.string()),
    url: v.string(),
    logo: v.string(),
    featured: v.boolean(),
    upvotes: v.number(),
    status: v.optional(v.union(v.literal("online"), v.literal("offline"), v.literal("hold"))),
    pricing: v.optional(v.string()),
  })
    .index("by_category", ["category"])
    .index("by_featured", ["featured"])
    .index("by_upvotes", ["upvotes"])
    .index("by_status", ["status"]),

  categories: defineTable({
    name: v.string(),
    parentId: v.optional(v.id("categories")),
    x: v.optional(v.number()),
    y: v.optional(v.number()),
  })
    .index("by_parent", ["parentId"])
    .index("by_name", ["name"]),
});
