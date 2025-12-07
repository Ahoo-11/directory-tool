import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const sampleTools: Array<{
  title: string;
  description: string;
  category: string;
  tags: string[];
  url: string;
  logo: string;
  featured: boolean;
  upvotes: number;
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
  },
  returns: v.object({
    tools: v.array(toolValidator),
    featured: v.union(toolValidator, v.null()),
  }),
  handler: async (ctx, args) => {
    const search = args.search?.toLowerCase().trim();
    const allTools = await ctx.db.query("tools").order("desc").collect();

    let filtered = allTools;
    if (args.category && args.category !== "All") {
      filtered = filtered.filter((tool) => tool.category === args.category);
    }
    if (search) {
      filtered = filtered.filter((tool) => {
        const haystack = `${tool.title} ${tool.description} ${tool.tags.join(" ")}`.toLowerCase();
        return haystack.includes(search);
      });
    }

    const featured = allTools.find((tool) => tool.featured) ?? filtered[0] ?? null;

    return { tools: filtered, featured };
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
