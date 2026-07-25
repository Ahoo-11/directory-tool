import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { ActionCtx } from "./_generated/server";
import { action, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { assertAdmin, assertAuthenticated, authenticateIntegration, type Actor } from "./lib/auth";

const kindValidator = v.union(v.literal("create"), v.literal("update"), v.literal("claim"));
const statusValidator = v.union(
  v.literal("pending"),
  v.literal("needs_changes"),
  v.literal("approved"),
  v.literal("rejected"),
  v.literal("duplicate"),
);
const sourceValidator = v.union(
  v.literal("web"),
  v.literal("mcp"),
  v.literal("api"),
  v.literal("crawler"),
  v.literal("csv"),
  v.literal("admin"),
);
const actorTypeValidator = v.union(v.literal("human"), v.literal("integration"), v.literal("system"));
const extractionMethodValidator = v.union(v.literal("firecrawl"), v.literal("metadata"), v.literal("submitted"));

const socialLinkValidator = v.object({
  platform: v.string(),
  url: v.string(),
});

const submissionValidator = v.object({
  _id: v.id("submissions"),
  _creationTime: v.number(),
  kind: kindValidator,
  status: statusValidator,
  source: sourceValidator,
  submittedByType: actorTypeValidator,
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
  socialLinks: v.array(socialLinkValidator),
  notes: v.optional(v.string()),
  sourceExcerpt: v.optional(v.string()),
  rawPayload: v.optional(v.string()),
  extractionMethod: extractionMethodValidator,
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
});

const enrichmentValidator = v.object({
  sourceUrl: v.string(),
  canonicalUrl: v.string(),
  title: v.string(),
  description: v.string(),
  category: v.string(),
  type: v.optional(v.string()),
  tags: v.array(v.string()),
  url: v.string(),
  logo: v.string(),
  pricing: v.optional(v.string()),
  screenshotUrl: v.optional(v.string()),
  socialLinks: v.array(socialLinkValidator),
  sourceExcerpt: v.optional(v.string()),
  rawPayload: v.optional(v.string()),
  extractionMethod: extractionMethodValidator,
  urlReachable: v.boolean(),
  warnings: v.array(v.string()),
});

type SocialLink = {
  platform: string;
  url: string;
};

type Enrichment = {
  sourceUrl: string;
  canonicalUrl: string;
  title: string;
  description: string;
  category: string;
  type?: string;
  tags: string[];
  url: string;
  logo: string;
  pricing?: string;
  screenshotUrl?: string;
  socialLinks: SocialLink[];
  sourceExcerpt?: string;
  rawPayload?: string;
  extractionMethod: "firecrawl" | "metadata" | "submitted";
  urlReachable: boolean;
  warnings: string[];
};

type FirecrawlResult = {
  title?: string;
  description?: string;
  category?: string;
  type?: string;
  tags?: string[];
  pricing?: string;
  logo?: string;
  screenshotUrl?: string;
  socialLinks?: SocialLink[];
  markdown?: string;
  rawPayload?: string;
};

type SubmissionStatus = "pending" | "needs_changes" | "approved" | "rejected" | "duplicate";

type SubmitResult = {
  submissionId: Id<"submissions">;
  status: SubmissionStatus;
  title: string;
  extractionMethod: "firecrawl" | "metadata" | "submitted";
  warnings: string[];
};

type IntegrationStatusResult = {
  submissionId: Id<"submissions">;
  status: SubmissionStatus;
  title: string;
  reviewNote?: string;
  publishedToolId?: Id<"tools">;
  updatedAt: number;
} | null;

type ReviewResult = {
  status: SubmissionStatus;
  publishedToolId?: Id<"tools">;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function stringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const items = value
    .map((item) => stringValue(item))
    .filter((item): item is string => Boolean(item));
  return items.length ? items : undefined;
}

function cleanText(value: string, maxLength: number): string {
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function decodeHtml(value: string): string {
  const entities: Record<string, string> = {
    amp: "&",
    quot: '"',
    apos: "'",
    lt: "<",
    gt: ">",
    nbsp: " ",
  };
  return value
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCharCode(Number.parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (match, name: string) => entities[name.toLowerCase()] ?? match);
}

function normalizeListingUrl(rawUrl: string): string {
  const value = rawUrl.trim();
  if (!value) throw new Error("A website URL is required");

  const withProtocol = /^[a-z][a-z\d+.-]*:\/\//i.test(value) ? value : `https://${value}`;
  const parsed = new URL(withProtocol);
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only http and https URLs are supported");
  }
  if (parsed.username || parsed.password) {
    throw new Error("URLs containing credentials are not supported");
  }

  assertSafeHostname(parsed.hostname);
  parsed.hash = "";
  parsed.hostname = parsed.hostname.toLowerCase();
  if ((parsed.protocol === "https:" && parsed.port === "443") || (parsed.protocol === "http:" && parsed.port === "80")) {
    parsed.port = "";
  }
  if (parsed.pathname !== "/") {
    parsed.pathname = parsed.pathname.replace(/\/+$/, "");
  }
  return parsed.toString();
}

function assertSafeHostname(hostname: string) {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  const blockedNames = ["localhost", "metadata.google.internal"];
  if (
    blockedNames.includes(host) ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host.endsWith(".lan")
  ) {
    throw new Error("Local and private network URLs are not allowed");
  }

  if (host === "::1" || host === "::" || host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe80:")) {
    throw new Error("Local and private network URLs are not allowed");
  }

  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!ipv4) return;
  const octets = ipv4.slice(1).map(Number);
  if (octets.some((octet) => octet > 255)) {
    throw new Error("Invalid IP address");
  }
  const [a, b] = octets;
  const blocked =
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a >= 224;
  if (blocked) throw new Error("Local and private network URLs are not allowed");
}

function attributesFromTag(tag: string): Record<string, string> {
  const attributes: Record<string, string> = {};
  const attributePattern = /([:\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;
  for (const match of tag.matchAll(attributePattern)) {
    attributes[match[1].toLowerCase()] = decodeHtml(match[2] ?? match[3] ?? match[4] ?? "");
  }
  return attributes;
}

function metadataFromHtml(html: string, names: string[]): string | undefined {
  const wanted = new Set(names.map((name) => name.toLowerCase()));
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const attributes = attributesFromTag(match[0]);
    const key = (attributes.property ?? attributes.name ?? "").toLowerCase();
    if (wanted.has(key) && attributes.content) return cleanText(attributes.content, 1000);
  }
  return undefined;
}

function linkFromHtml(html: string, relName: string): string | undefined {
  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    const attributes = attributesFromTag(match[0]);
    if ((attributes.rel ?? "").toLowerCase().split(/\s+/).includes(relName) && attributes.href) {
      return attributes.href;
    }
  }
  return undefined;
}

function absoluteUrl(value: string | undefined, baseUrl: string): string | undefined {
  if (!value) return undefined;
  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return undefined;
  }
}

function extractSocialLinks(html: string, baseUrl: string): SocialLink[] {
  const platforms: Array<[string, RegExp]> = [
    ["X", /(^|\.)x\.com$|(^|\.)twitter\.com$/i],
    ["LinkedIn", /(^|\.)linkedin\.com$/i],
    ["GitHub", /(^|\.)github\.com$/i],
    ["YouTube", /(^|\.)youtube\.com$|(^|\.)youtu\.be$/i],
    ["Facebook", /(^|\.)facebook\.com$/i],
    ["Instagram", /(^|\.)instagram\.com$/i],
  ];
  const found = new Map<string, string>();
  for (const match of html.matchAll(/<a\b[^>]*>/gi)) {
    const href = attributesFromTag(match[0]).href;
    const absolute = absoluteUrl(href, baseUrl);
    if (!absolute) continue;
    try {
      const hostname = new URL(absolute).hostname;
      const platform = platforms.find(([, pattern]) => pattern.test(hostname))?.[0];
      if (platform && !found.has(platform)) found.set(platform, absolute);
    } catch {
      // Ignore malformed links from source pages.
    }
  }
  return Array.from(found, ([platform, url]) => ({ platform, url })).slice(0, 8);
}

function visibleTextFromHtml(html: string): string {
  return cleanText(
    decodeHtml(
      html
        .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
        .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
        .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, " ")
        .replace(/<[^>]+>/g, " "),
    ),
    12000,
  );
}

function inferCategory(text: string): string {
  const haystack = text.toLowerCase();
  const categories: Array<[string, string[]]> = [
    ["Coding", ["developer", "coding", "code editor", "api", "sdk", "github"]],
    ["Image Gen", ["image generation", "generate images", "photo editor", "design ai"]],
    ["Copywriting", ["copywriting", "content writer", "marketing copy", "blog writer"]],
    ["Audio", ["audio", "voice", "speech", "podcast", "music generation"]],
    ["Analytics", ["analytics", "dashboard", "metrics", "business intelligence"]],
    ["Productivity", ["productivity", "workflow", "task management", "automation", "meeting"]],
  ];
  let best: { category: string; score: number } = { category: "General", score: 0 };
  for (const [category, keywords] of categories) {
    const score = keywords.filter((keyword) => haystack.includes(keyword)).length;
    if (score > best.score) best = { category, score };
  }
  return best.category;
}

function inferPricing(text: string): string | undefined {
  const haystack = text.toLowerCase();
  if (haystack.includes("free trial") || (haystack.includes("free") && haystack.includes("paid"))) return "Freemium";
  if (haystack.includes("open source") || haystack.includes("100% free") || haystack.includes("completely free")) return "Free";
  if (haystack.includes("pricing") || /\$\d+/.test(haystack) || haystack.includes("per month")) return "Paid";
  return undefined;
}

function inferTags(text: string): string[] {
  const haystack = text.toLowerCase();
  const candidates: Array<[string, string[]]> = [
    ["ai", ["artificial intelligence", " ai ", "llm"]],
    ["automation", ["automation", "automate", "workflow"]],
    ["developer", ["developer", "coding", "api", "sdk"]],
    ["marketing", ["marketing", "seo", "campaign"]],
    ["design", ["design", "image", "creative"]],
    ["analytics", ["analytics", "metrics", "insights"]],
    ["productivity", ["productivity", "tasks", "meeting"]],
    ["audio", ["audio", "voice", "speech"]],
    ["collaboration", ["collaboration", "team", "workspace"]],
  ];
  return candidates
    .filter(([, keywords]) => keywords.some((keyword) => haystack.includes(keyword)))
    .map(([tag]) => tag)
    .slice(0, 8);
}

function domainTitle(url: string): string {
  const hostname = new URL(url).hostname.replace(/^www\./, "");
  const name = hostname.split(".")[0].replace(/[-_]+/g, " ");
  return name.replace(/\b\w/g, (character) => character.toUpperCase()) || hostname;
}

async function readTextLimited(response: Response, maxBytes = 1_000_000): Promise<string> {
  if (!response.body) return "";
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let received = 0;
  let output = "";
  while (received < maxBytes) {
    const { value, done } = await reader.read();
    if (done) break;
    if (!value) continue;
    received += value.byteLength;
    output += decoder.decode(value, { stream: true });
    if (received >= maxBytes) {
      await reader.cancel();
      break;
    }
  }
  output += decoder.decode();
  return output.slice(0, maxBytes);
}

async function fetchPublicHtml(startUrl: string): Promise<{ html: string; finalUrl: string }> {
  let currentUrl = startUrl;
  for (let redirectCount = 0; redirectCount <= 4; redirectCount += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    try {
      const response = await fetch(currentUrl, {
        redirect: "manual",
        signal: controller.signal,
        headers: {
          Accept: "text/html,application/xhtml+xml",
          "User-Agent": "AntigravityDirectoryBot/1.0 (+listing enrichment)",
        },
      });
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location) throw new Error("Website redirected without a location");
        currentUrl = normalizeListingUrl(new URL(location, currentUrl).toString());
        continue;
      }
      if (!response.ok) throw new Error(`Website returned HTTP ${response.status}`);
      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
        throw new Error("Website did not return an HTML page");
      }
      return { html: await readTextLimited(response), finalUrl: currentUrl };
    } finally {
      clearTimeout(timeout);
    }
  }
  throw new Error("Website redirected too many times");
}

function parseFirecrawlSocialLinks(value: unknown): SocialLink[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const links = value.flatMap((item): SocialLink[] => {
    if (!isRecord(item)) return [];
    const platform = stringValue(item.platform);
    const url = stringValue(item.url);
    return platform && url ? [{ platform, url }] : [];
  });
  return links.length ? links.slice(0, 8) : undefined;
}

async function scrapeWithFirecrawl(url: string): Promise<FirecrawlResult | null> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) return null;

  const baseUrl = (process.env.FIRECRAWL_API_URL ?? "https://api.firecrawl.dev").replace(/\/+$/, "");
  const response = await fetch(`${baseUrl}/v2/scrape`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url,
      formats: [
        "markdown",
        "links",
        "branding",
        {
          type: "json",
          prompt:
            "Extract the product or tool name, a factual short description, its best directory category, product type, up to 8 concise tags, pricing model, official logo URL, and official social links. Do not invent missing values.",
          schema: {
            type: "object",
            properties: {
              title: { type: "string" },
              description: { type: "string" },
              category: { type: "string" },
              type: { type: "string" },
              tags: { type: "array", items: { type: "string" } },
              pricing: { type: "string" },
              logo: { type: "string" },
              socialLinks: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    platform: { type: "string" },
                    url: { type: "string" },
                  },
                  required: ["platform", "url"],
                },
              },
            },
          },
        },
        {
          type: "screenshot",
          fullPage: false,
          quality: 70,
          viewport: { width: 1280, height: 720 },
        },
      ],
      onlyMainContent: false,
      blockAds: true,
      removeBase64Images: true,
      maxAge: 86_400_000,
      timeout: 30_000,
    }),
  });

  const rawText = await response.text();
  if (!response.ok) {
    throw new Error(`Firecrawl returned HTTP ${response.status}`);
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawText);
  } catch {
    throw new Error("Firecrawl returned invalid JSON");
  }
  if (!isRecord(payload)) throw new Error("Firecrawl returned an invalid response");
  const data = isRecord(payload.data) ? payload.data : payload;
  const extracted = isRecord(data.json) ? data.json : {};
  const metadata = isRecord(data.metadata) ? data.metadata : {};
  const branding = isRecord(data.branding) ? data.branding : {};

  const brandingLogo =
    stringValue(branding.logo) ??
    (isRecord(branding.images) ? stringValue(branding.images.logo) : undefined);

  return {
    title: stringValue(extracted.title) ?? stringValue(metadata.title) ?? stringValue(metadata.ogTitle),
    description:
      stringValue(extracted.description) ??
      stringValue(metadata.description) ??
      stringValue(metadata.ogDescription),
    category: stringValue(extracted.category),
    type: stringValue(extracted.type),
    tags: stringArray(extracted.tags),
    pricing: stringValue(extracted.pricing),
    logo:
      absoluteUrl(stringValue(extracted.logo), url) ??
      absoluteUrl(brandingLogo, url) ??
      absoluteUrl(stringValue(metadata.favicon), url) ??
      absoluteUrl(stringValue(metadata.ogImage), url),
    screenshotUrl: stringValue(data.screenshot),
    socialLinks: parseFirecrawlSocialLinks(extracted.socialLinks),
    markdown: stringValue(data.markdown),
    rawPayload: rawText.slice(0, 20_000),
  };
}

async function enrichListingUrl(rawUrl: string): Promise<Enrichment> {
  const canonicalUrl = normalizeListingUrl(rawUrl);
  const warnings: string[] = [];
  let firecrawl: FirecrawlResult | null = null;

  if (process.env.FIRECRAWL_API_KEY) {
    try {
      firecrawl = await scrapeWithFirecrawl(canonicalUrl);
    } catch (error) {
      warnings.push(error instanceof Error ? error.message : "Firecrawl extraction failed");
    }
  } else {
    warnings.push("Firecrawl is not configured; basic website metadata was used");
  }

  let html = "";
  let finalUrl = canonicalUrl;
  try {
    const fetched = await fetchPublicHtml(canonicalUrl);
    html = fetched.html;
    finalUrl = fetched.finalUrl;
  } catch (error) {
    if (!firecrawl) {
      warnings.push(error instanceof Error ? error.message : "Website metadata could not be loaded");
    }
  }

  const htmlTitle = cleanText(
    decodeHtml(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? ""),
    160,
  );
  const pageTitle = metadataFromHtml(html, ["og:title", "twitter:title"]) ?? (htmlTitle || undefined);
  const description = metadataFromHtml(html, ["og:description", "twitter:description", "description"]);
  const favicon =
    absoluteUrl(linkFromHtml(html, "icon"), finalUrl) ??
    absoluteUrl(metadataFromHtml(html, ["og:image", "twitter:image"]), finalUrl) ??
    new URL("/favicon.ico", finalUrl).toString();
  const visibleText = visibleTextFromHtml(html);
  const combinedText = cleanText(
    `${firecrawl?.title ?? pageTitle ?? ""} ${firecrawl?.description ?? description ?? ""} ${
      firecrawl?.markdown ?? visibleText
    }`,
    20_000,
  );
  const title = cleanText(firecrawl?.title ?? pageTitle ?? domainTitle(finalUrl), 160);
  const finalDescription = cleanText(
    firecrawl?.description ?? description ?? `Discover ${title} and learn what it offers.`,
    600,
  );
  const tags = Array.from(new Set((firecrawl?.tags ?? inferTags(combinedText)).map((tag) => cleanText(tag.toLowerCase(), 30))))
    .filter(Boolean)
    .slice(0, 8);
  const socialLinks = firecrawl?.socialLinks ?? extractSocialLinks(html, finalUrl);

  return {
    sourceUrl: rawUrl.trim(),
    canonicalUrl,
    title,
    description: finalDescription,
    category: cleanText(firecrawl?.category ?? inferCategory(combinedText), 80),
    type: cleanText(firecrawl?.type ?? "Web App", 80),
    tags,
    url: finalUrl,
    logo: firecrawl?.logo ?? favicon,
    ...(firecrawl?.pricing ?? inferPricing(combinedText)
      ? { pricing: cleanText(firecrawl?.pricing ?? inferPricing(combinedText)!, 80) }
      : {}),
    ...(firecrawl?.screenshotUrl ? { screenshotUrl: firecrawl.screenshotUrl } : {}),
    socialLinks,
    ...(combinedText ? { sourceExcerpt: combinedText.slice(0, 2500) } : {}),
    ...(firecrawl?.rawPayload ? { rawPayload: firecrawl.rawPayload } : {}),
    extractionMethod: firecrawl ? "firecrawl" : "metadata",
    urlReachable: Boolean(firecrawl || html),
    warnings,
  };
}

async function createSubmission(
  ctx: ActionCtx,
  args: {
    actor: Actor;
    source: "web" | "mcp" | "api" | "crawler" | "csv" | "admin";
    url: string;
    kind: "create" | "update" | "claim";
    targetToolId?: Id<"tools">;
    notes?: string;
  },
): Promise<SubmitResult> {
  if (args.kind !== "create" && !args.targetToolId) {
    throw new Error("A target listing is required for update and claim submissions");
  }

  const enrichment = await enrichListingUrl(args.url);
  const duplicate: { toolId?: Id<"tools">; submissionId?: Id<"submissions"> } = await ctx.runQuery(
    internal.submissions.findDuplicateInternal,
    {
    canonicalUrl: enrichment.canonicalUrl,
    },
  );
  const status: SubmissionStatus = duplicate.toolId || duplicate.submissionId ? "duplicate" : "pending";

  const submissionId: Id<"submissions"> = await ctx.runMutation(internal.submissions.createSubmissionInternal, {
    ...enrichment,
    kind: args.kind,
    status,
    source: args.source,
    submittedByType: args.actor.type,
    submittedById: args.actor.id,
    ...(args.actor.name ? { submittedByName: args.actor.name } : {}),
    ...(args.actor.email ? { submittedByEmail: args.actor.email } : {}),
    ...(args.targetToolId ? { targetToolId: args.targetToolId } : {}),
    ...(args.notes?.trim() ? { notes: cleanText(args.notes, 2000) } : {}),
    ...(duplicate.toolId ? { duplicateToolId: duplicate.toolId } : {}),
    ...(duplicate.submissionId ? { duplicateSubmissionId: duplicate.submissionId } : {}),
  });

  return {
    submissionId,
    status,
    title: enrichment.title,
    extractionMethod: enrichment.extractionMethod,
    warnings: enrichment.warnings,
  };
}

export const previewListing = action({
  args: { url: v.string() },
  returns: enrichmentValidator,
  handler: async (ctx, args): Promise<Enrichment> => {
    assertAuthenticated(await ctx.auth.getUserIdentity());
    return await enrichListingUrl(args.url);
  },
});

export const previewListingFromIntegration = action({
  args: {
    apiKey: v.string(),
    url: v.string(),
  },
  returns: enrichmentValidator,
  handler: async (_ctx, args): Promise<Enrichment> => {
    authenticateIntegration(args.apiKey);
    return await enrichListingUrl(args.url);
  },
});

export const submitListing = action({
  args: {
    url: v.string(),
    notes: v.optional(v.string()),
    kind: v.optional(kindValidator),
    targetToolId: v.optional(v.id("tools")),
  },
  returns: v.object({
    submissionId: v.id("submissions"),
    status: statusValidator,
    title: v.string(),
    extractionMethod: extractionMethodValidator,
    warnings: v.array(v.string()),
  }),
  handler: async (ctx, args): Promise<SubmitResult> => {
    const actor = assertAuthenticated(await ctx.auth.getUserIdentity());
    return await createSubmission(ctx, {
      actor,
      source: "web",
      url: args.url,
      kind: args.kind ?? "create",
      targetToolId: args.targetToolId,
      notes: args.notes,
    });
  },
});

export const submitListingFromIntegration = action({
  args: {
    apiKey: v.string(),
    url: v.string(),
    notes: v.optional(v.string()),
    kind: v.optional(kindValidator),
    targetToolId: v.optional(v.id("tools")),
  },
  returns: v.object({
    submissionId: v.id("submissions"),
    status: statusValidator,
    title: v.string(),
    extractionMethod: extractionMethodValidator,
    warnings: v.array(v.string()),
  }),
  handler: async (ctx, args): Promise<SubmitResult> => {
    const actor = authenticateIntegration(args.apiKey);
    return await createSubmission(ctx, {
      actor,
      source: "mcp",
      url: args.url,
      kind: args.kind ?? "create",
      targetToolId: args.targetToolId,
      notes: args.notes,
    });
  },
});

export const getSubmissionStatusFromIntegration = action({
  args: {
    apiKey: v.string(),
    submissionId: v.id("submissions"),
  },
  returns: v.union(
    v.object({
      submissionId: v.id("submissions"),
      status: statusValidator,
      title: v.string(),
      reviewNote: v.optional(v.string()),
      publishedToolId: v.optional(v.id("tools")),
      updatedAt: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args): Promise<IntegrationStatusResult> => {
    const actor = authenticateIntegration(args.apiKey);
    return await ctx.runQuery(internal.submissions.getIntegrationSubmissionInternal, {
      submissionId: args.submissionId,
      submittedById: actor.id,
    });
  },
});

export const findDuplicateInternal = internalQuery({
  args: { canonicalUrl: v.string() },
  returns: v.object({
    toolId: v.optional(v.id("tools")),
    submissionId: v.optional(v.id("submissions")),
  }),
  handler: async (
    ctx,
    args,
  ): Promise<{ toolId?: Id<"tools">; submissionId?: Id<"submissions"> }> => {
    let tool = await ctx.db
      .query("tools")
      .withIndex("by_canonical_url", (q) => q.eq("canonicalUrl", args.canonicalUrl))
      .first();
    if (!tool) {
      const legacyTools = await ctx.db.query("tools").collect();
      tool =
        legacyTools.find((candidate) => {
          if (!candidate.url) return false;
          try {
            return normalizeListingUrl(candidate.url) === args.canonicalUrl;
          } catch {
            return false;
          }
        }) ?? null;
    }
    const submission = await ctx.db
      .query("submissions")
      .withIndex("by_canonical_url", (q) => q.eq("canonicalUrl", args.canonicalUrl))
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "pending"),
          q.eq(q.field("status"), "needs_changes"),
          q.eq(q.field("status"), "approved"),
          q.eq(q.field("status"), "duplicate"),
        ),
      )
      .first();

    return {
      ...(tool ? { toolId: tool._id } : {}),
      ...(submission ? { submissionId: submission._id } : {}),
    };
  },
});

export const createSubmissionInternal = internalMutation({
  args: {
    kind: kindValidator,
    status: statusValidator,
    source: sourceValidator,
    submittedByType: actorTypeValidator,
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
    socialLinks: v.array(socialLinkValidator),
    notes: v.optional(v.string()),
    sourceExcerpt: v.optional(v.string()),
    rawPayload: v.optional(v.string()),
    extractionMethod: extractionMethodValidator,
    urlReachable: v.boolean(),
    duplicateToolId: v.optional(v.id("tools")),
    duplicateSubmissionId: v.optional(v.id("submissions")),
    warnings: v.array(v.string()),
  },
  returns: v.id("submissions"),
  handler: async (ctx, args) => {
    const now = Date.now();
    const submissionId = await ctx.db.insert("submissions", {
      ...args,
      updatedAt: now,
    });
    await ctx.db.insert("auditEvents", {
      entityType: "submission",
      entityId: submissionId,
      action: "submitted",
      actorType: args.submittedByType,
      actorId: args.submittedById,
      ...(args.submittedByName ? { actorName: args.submittedByName } : {}),
      ...(args.submittedByEmail ? { actorEmail: args.submittedByEmail } : {}),
      metadata: JSON.stringify({ source: args.source, status: args.status }),
      createdAt: now,
    });
    return submissionId;
  },
});

export const getIntegrationSubmissionInternal = internalQuery({
  args: {
    submissionId: v.id("submissions"),
    submittedById: v.string(),
  },
  returns: v.union(
    v.object({
      submissionId: v.id("submissions"),
      status: statusValidator,
      title: v.string(),
      reviewNote: v.optional(v.string()),
      publishedToolId: v.optional(v.id("tools")),
      updatedAt: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const submission = await ctx.db.get(args.submissionId);
    if (!submission || submission.submittedById !== args.submittedById) return null;
    return {
      submissionId: submission._id,
      status: submission.status,
      title: submission.title,
      ...(submission.reviewNote ? { reviewNote: submission.reviewNote } : {}),
      ...(submission.publishedToolId ? { publishedToolId: submission.publishedToolId } : {}),
      updatedAt: submission.updatedAt,
    };
  },
});

export const listMySubmissions = query({
  args: {},
  returns: v.array(submissionValidator),
  handler: async (ctx) => {
    const actor = assertAuthenticated(await ctx.auth.getUserIdentity());
    return await ctx.db.query("submissions").withIndex("by_submitter", (q) => q.eq("submittedById", actor.id)).order("desc").collect();
  },
});

export const listSubmissionsAdmin = query({
  args: {
    status: v.optional(statusValidator),
  },
  returns: v.array(submissionValidator),
  handler: async (ctx, args) => {
    assertAdmin(await ctx.auth.getUserIdentity());
    if (args.status) {
      return await ctx.db.query("submissions").withIndex("by_status", (q) => q.eq("status", args.status!)).order("desc").collect();
    }
    return await ctx.db.query("submissions").order("desc").collect();
  },
});

export const updateSubmissionAdmin = mutation({
  args: {
    submissionId: v.id("submissions"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    type: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    url: v.optional(v.string()),
    logo: v.optional(v.string()),
    pricing: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const actor = assertAdmin(await ctx.auth.getUserIdentity());
    const submission = await ctx.db.get(args.submissionId);
    if (!submission) throw new Error("Submission not found");
    if (submission.status === "approved" || submission.status === "rejected") {
      throw new Error("Reviewed submissions cannot be edited");
    }

    const { submissionId, ...fields } = args;
    const updates = Object.fromEntries(
      Object.entries(fields).filter(([, value]) => value !== undefined),
    );
    await ctx.db.patch(submissionId, { ...updates, updatedAt: Date.now() });
    await ctx.db.insert("auditEvents", {
      entityType: "submission",
      entityId: submissionId,
      action: "edited",
      actorType: actor.type,
      actorId: actor.id,
      ...(actor.name ? { actorName: actor.name } : {}),
      ...(actor.email ? { actorEmail: actor.email } : {}),
      createdAt: Date.now(),
    });
    return null;
  },
});

export const reviewSubmission = mutation({
  args: {
    submissionId: v.id("submissions"),
    decision: v.union(v.literal("approve"), v.literal("reject"), v.literal("needs_changes")),
    note: v.optional(v.string()),
  },
  returns: v.object({
    status: statusValidator,
    publishedToolId: v.optional(v.id("tools")),
  }),
  handler: async (ctx, args): Promise<ReviewResult> => {
    const actor = assertAdmin(await ctx.auth.getUserIdentity());
    const submission = await ctx.db.get(args.submissionId);
    if (!submission) throw new Error("Submission not found");
    if (submission.status === "approved" || submission.status === "rejected") {
      throw new Error("Submission has already been reviewed");
    }

    const now = Date.now();
    const reviewFields = {
      reviewedById: actor.id,
      ...(actor.name ? { reviewedByName: actor.name } : {}),
      ...(actor.email ? { reviewedByEmail: actor.email } : {}),
      reviewedAt: now,
      ...(args.note?.trim() ? { reviewNote: cleanText(args.note, 2000) } : {}),
      updatedAt: now,
    };

    if (args.decision !== "approve") {
      const nextStatus: "rejected" | "needs_changes" =
        args.decision === "reject" ? "rejected" : "needs_changes";
      await ctx.db.patch(submission._id, { ...reviewFields, status: nextStatus });
      await ctx.db.insert("auditEvents", {
        entityType: "submission",
        entityId: submission._id,
        action: nextStatus,
        actorType: actor.type,
        actorId: actor.id,
        ...(actor.name ? { actorName: actor.name } : {}),
        ...(actor.email ? { actorEmail: actor.email } : {}),
        ...(args.note?.trim() ? { metadata: JSON.stringify({ note: cleanText(args.note, 2000) }) } : {}),
        createdAt: now,
      });
      return { status: nextStatus };
    }

    let publishedToolId: Id<"tools">;
    if (submission.kind === "create") {
      publishedToolId = await ctx.db.insert("tools", {
        title: submission.title,
        description: submission.description,
        category: submission.category,
        type: submission.type,
        tags: [...submission.tags],
        url: submission.url,
        logo: submission.logo,
        featured: false,
        status: "online",
        pricing: submission.pricing,
        canonicalUrl: submission.canonicalUrl,
        domain: new URL(submission.canonicalUrl).hostname,
        ...(submission.submittedByType === "human" ? { ownerUserId: submission.submittedById } : {}),
        ownerType: submission.submittedByType,
        ownerId: submission.submittedById,
        publishedFromSubmissionId: submission._id,
      });
    } else {
      if (!submission.targetToolId) throw new Error("Submission has no target listing");
      const target = await ctx.db.get(submission.targetToolId);
      if (!target) throw new Error("Target listing not found");
      publishedToolId = target._id;
      if (submission.kind === "claim") {
        await ctx.db.patch(target._id, {
          ...(submission.submittedByType === "human" ? { ownerUserId: submission.submittedById } : {}),
          ownerType: submission.submittedByType,
          ownerId: submission.submittedById,
        });
      } else {
        await ctx.db.patch(target._id, {
          title: submission.title,
          description: submission.description,
          category: submission.category,
          type: submission.type,
          tags: [...submission.tags],
          url: submission.url,
          logo: submission.logo,
          pricing: submission.pricing,
          canonicalUrl: submission.canonicalUrl,
          domain: new URL(submission.canonicalUrl).hostname,
        });
      }
    }

    await ctx.db.patch(submission._id, {
      ...reviewFields,
      status: "approved",
      publishedToolId,
    });
    await ctx.db.insert("auditEvents", {
      entityType: "submission",
      entityId: submission._id,
      action: "approved",
      actorType: actor.type,
      actorId: actor.id,
      ...(actor.name ? { actorName: actor.name } : {}),
      ...(actor.email ? { actorEmail: actor.email } : {}),
      metadata: JSON.stringify({ publishedToolId }),
      createdAt: now,
    });
    await ctx.db.insert("auditEvents", {
      entityType: "tool",
      entityId: publishedToolId,
      action: submission.kind === "create" ? "published" : submission.kind,
      actorType: actor.type,
      actorId: actor.id,
      ...(actor.name ? { actorName: actor.name } : {}),
      ...(actor.email ? { actorEmail: actor.email } : {}),
      metadata: JSON.stringify({ submissionId: submission._id }),
      createdAt: now,
    });

    return { status: "approved", publishedToolId };
  },
});

export const listAuditEventsAdmin = query({
  args: {
    entityType: v.union(v.literal("submission"), v.literal("tool")),
    entityId: v.string(),
  },
  handler: async (ctx, args) => {
    assertAdmin(await ctx.auth.getUserIdentity());
    return await ctx.db
      .query("auditEvents")
      .withIndex("by_entity", (q) => q.eq("entityType", args.entityType).eq("entityId", args.entityId))
      .order("desc")
      .collect();
  },
});
