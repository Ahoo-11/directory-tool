import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const ADMIN_EMAIL = "ahoo11official@gmail.com";

function assertAdmin(email: string | undefined | null) {
  if (!email || email.toLowerCase() !== ADMIN_EMAIL) {
    throw new Error("Admin access required");
  }
}

const sampleTools: Array<{
  title: string;
  description: string;
  category: string;
  tags: string[];
  url: string;
  logo: string;
  featured: boolean;
  upvotes: number;
  status: "online" | "offline" | "hold";
  pricing?: string;
}> = [
  {
    title: "Nebula Copy",
    description: "AI-native copy hub with brand voice memory and instant briefs.",
    category: "Copywriting",
    tags: ["copy", "marketing", "voice"],
    url: "https://example.com/nebula",
    logo: "🪐",
    featured: true,
    upvotes: 1280,
    status: "online",
    pricing: "Freemium",
  },
  {
    title: "PixelCrafter",
    description: "Image generation with layered edits, masks, and live prompts.",
    category: "Image Gen",
    tags: ["vision", "editing"],
    url: "https://example.com/pixelcrafter",
    logo: "🎨",
    featured: false,
    upvotes: 987,
    status: "online",
    pricing: "Paid",
  },
  {
    title: "CodeFuse",
    description: "Pair-programming AI with repo-aware context and inline tests.",
    category: "Coding",
    tags: ["developer", "tests"],
    url: "https://example.com/codefuse",
    logo: "⚡",
    featured: false,
    upvotes: 1542,
    status: "online",
    pricing: "Free",
  },
  {
    title: "SynthVoice",
    description: "Ultra-realistic multilingual voiceover with sentiment control.",
    category: "Audio",
    tags: ["voice", "multilingual"],
    url: "https://example.com/synthvoice",
    logo: "🔊",
    featured: false,
    upvotes: 803,
    status: "online",
    pricing: "Paid",
  },
  {
    title: "InsightOps",
    description: "LLM dashboards for metrics, anomalies, and alert summaries.",
    category: "Analytics",
    tags: ["ops", "monitoring"],
    url: "https://example.com/insightops",
    logo: "📊",
    featured: false,
    upvotes: 1120,
    status: "online",
    pricing: "Freemium",
  },
  {
    title: "PromptBoard",
    description: "Team prompt versioning, evals, and rollout guards in one UI.",
    category: "Productivity",
    tags: ["prompts", "governance"],
    url: "https://example.com/promptboard",
    logo: "🧭",
    featured: false,
    upvotes: 640,
    status: "online",
    pricing: "Free",
  },
] as const;

const toolValidator = v.object({
  _id: v.id("tools"),
  _creationTime: v.number(),
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
});

const categoryValidator = v.object({
  _id: v.id("categories"),
  _creationTime: v.number(),
  name: v.string(),
  parentId: v.optional(v.id("categories")),
  x: v.optional(v.number()),
  y: v.optional(v.number()),
});

export const seedTools = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const existing = await ctx.db.query("tools").take(1);
    if (existing.length > 0) {
      return null;
    }
    for (const tool of sampleTools) {
      await ctx.db.insert("tools", { ...tool, tags: [...tool.tags] });
    }
    return null;
  },
});

export const listTools = query({
  args: {
    category: v.optional(v.string()),
    search: v.optional(v.string()),
    tag: v.optional(v.string()),
    includeAll: v.optional(v.boolean()),
  },
  returns: v.object({
    tools: v.array(toolValidator),
    featured: v.union(toolValidator, v.null()),
  }),
  handler: async (ctx, args) => {
    const search = args.search?.toLowerCase().trim();
    const allTools = await ctx.db.query("tools").order("desc").collect();

    let filtered = allTools;

    // Filter by status - only show "online" tools unless includeAll is true (for admin)
    if (!args.includeAll) {
      filtered = filtered.filter((tool) => tool.status === "online" || tool.status === undefined);
    }

    if (args.category && args.category !== "All") {
      filtered = filtered.filter((tool) => tool.category === args.category);
    }
    if (args.tag) {
      filtered = filtered.filter((tool) => tool.tags.includes(args.tag!));
    }
    if (search) {
      filtered = filtered.filter((tool) => {
        const haystack = `${tool.title} ${tool.description} ${tool.tags.join(" ")}`.toLowerCase();
        return haystack.includes(search);
      });
    }

    const onlineTools = allTools.filter((tool) => tool.status === "online" || tool.status === undefined);
    const featured = onlineTools.find((tool) => tool.featured) ?? filtered[0] ?? null;

    return { tools: filtered, featured };
  },
});

export const getTool = query({
  args: { toolId: v.id("tools") },
  returns: v.union(toolValidator, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.toolId);
  },
});

export const createTool = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    category: v.string(),
    tags: v.array(v.string()),
    url: v.string(),
    logo: v.string(),
    featured: v.boolean(),
    upvotes: v.optional(v.number()),
    status: v.optional(v.union(v.literal("online"), v.literal("offline"), v.literal("hold"))),
    pricing: v.optional(v.string()),
  },
  returns: v.object({ toolId: v.id("tools") }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    assertAdmin(identity?.email);

    const toolId = await ctx.db.insert("tools", {
      ...args,
      tags: [...args.tags],
      upvotes: args.upvotes ?? 0,
      status: args.status ?? "hold",
      pricing: args.pricing,
    });

    return { toolId };
  },
});

export const updateTool = mutation({
  args: {
    toolId: v.id("tools"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    url: v.optional(v.string()),
    logo: v.optional(v.string()),
    featured: v.optional(v.boolean()),
    upvotes: v.optional(v.number()),
    status: v.optional(v.union(v.literal("online"), v.literal("offline"), v.literal("hold"))),
    pricing: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    assertAdmin(identity?.email);

    const tool = await ctx.db.get(args.toolId);
    if (!tool) {
      throw new Error("Tool not found");
    }

    const updates = {
      ...(args.title !== undefined ? { title: args.title } : {}),
      ...(args.description !== undefined ? { description: args.description } : {}),
      ...(args.category !== undefined ? { category: args.category } : {}),
      ...(args.tags !== undefined ? { tags: [...args.tags] } : {}),
      ...(args.url !== undefined ? { url: args.url } : {}),
      ...(args.logo !== undefined ? { logo: args.logo } : {}),
      ...(args.featured !== undefined ? { featured: args.featured } : {}),
      ...(args.upvotes !== undefined ? { upvotes: args.upvotes } : {}),
      ...(args.status !== undefined ? { status: args.status } : {}),
      ...(args.pricing !== undefined ? { pricing: args.pricing } : {}),
    };

    await ctx.db.patch(args.toolId, updates);
    return null;
  },
});

export const deleteTool = mutation({
  args: {
    toolId: v.id("tools"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    assertAdmin(identity?.email);

    await ctx.db.delete(args.toolId);
    return null;
  },
});

export const upvoteTool = mutation({
  args: {
    toolId: v.id("tools"),
  },
  returns: v.object({
    upvotes: v.number(),
  }),
  handler: async (ctx, args) => {
    const tool = await ctx.db.get(args.toolId);
    if (!tool) {
      throw new Error("Tool not found");
    }
    const next = tool.upvotes + 1;
    await ctx.db.patch(args.toolId, { upvotes: next });
    return { upvotes: next };
  },
});

export const listCategories = query({
  args: {},
  returns: v.array(categoryValidator),
  handler: async (ctx) => {
    return await ctx.db.query("categories").order("asc").collect();
  },
});

export const createCategory = mutation({
  args: {
    name: v.string(),
    parentId: v.optional(v.id("categories")),
    x: v.optional(v.number()),
    y: v.optional(v.number()),
  },
  returns: v.object({ categoryId: v.id("categories") }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    assertAdmin(identity?.email);

    const categoryId = await ctx.db.insert("categories", {
      name: args.name.trim(),
      parentId: args.parentId,
      x: args.x,
      y: args.y,
    });

    return { categoryId };
  },
});

export const updateCategory = mutation({
  args: {
    categoryId: v.id("categories"),
    name: v.optional(v.string()),
    parentId: v.optional(v.union(v.id("categories"), v.null())),
    x: v.optional(v.number()),
    y: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    assertAdmin(identity?.email);

    const existing = await ctx.db.get(args.categoryId);
    if (!existing) {
      throw new Error("Category not found");
    }

    const updates: Record<string, unknown> = {};
    if (args.name !== undefined) updates.name = args.name.trim();
    if (args.parentId !== undefined) updates.parentId = args.parentId ?? undefined;
    if (args.x !== undefined) updates.x = args.x;
    if (args.y !== undefined) updates.y = args.y;

    await ctx.db.patch(args.categoryId, updates);
    return null;
  },
});

export const deleteCategory = mutation({
  args: {
    categoryId: v.id("categories"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    assertAdmin(identity?.email);

    const existing = await ctx.db.get(args.categoryId);
    if (!existing) {
      throw new Error("Category not found");
    }

    const children = await ctx.db
      .query("categories")
      .withIndex("by_parent", (q) => q.eq("parentId", args.categoryId))
      .take(1);

    if (children.length > 0) {
      throw new Error("Category has subcategories. Delete subcategories first.");
    }

    await ctx.db.delete(args.categoryId);
    return null;
  },
});
