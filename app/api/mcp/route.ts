import { ConvexHttpClient } from "convex/browser";
import type { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type JsonRpcRequest = {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: unknown;
};

type ToolArguments = Record<string, unknown>;

function rpcResult(id: JsonRpcRequest["id"], result: unknown, status = 200) {
  return Response.json({ jsonrpc: "2.0", id: id ?? null, result }, { status });
}

function rpcError(id: JsonRpcRequest["id"], code: number, message: string, status = 200) {
  return Response.json(
    {
      jsonrpc: "2.0",
      id: id ?? null,
      error: { code, message },
    },
    { status },
  );
}

function getBearerToken(request: Request): string | null {
  const authorization = request.headers.get("authorization");
  if (!authorization?.toLowerCase().startsWith("bearer ")) return null;
  return authorization.slice(7).trim() || null;
}

function getConvexClient() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
  return new ConvexHttpClient(url);
}

function asObject(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function requiredString(args: ToolArguments, name: string): string {
  const value = args[name];
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${name} is required`);
  }
  return value.trim();
}

function optionalString(args: ToolArguments, name: string): string | undefined {
  const value = args[name];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function optionalStringArray(args: ToolArguments, name: string): string[] | undefined {
  const value = args[name];
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error(`${name} must be an array of strings`);
  }
  return value.map((item) => item.trim()).filter(Boolean);
}

function optionalInteger(args: ToolArguments, name: string): number | undefined {
  const value = args[name];
  if (value === undefined) return undefined;
  if (typeof value !== "number" || !Number.isFinite(value) || !Number.isInteger(value)) {
    throw new Error(`${name} must be an integer`);
  }
  return value;
}

const tools = [
  {
    name: "list_tools",
    description:
      "List existing approved tools in the directory. Draft, held, and pending submissions are excluded.",
    inputSchema: {
      type: "object",
      properties: {
        search: { type: "string", description: "Optional text search" },
        category: { type: "string", description: "Optional exact category filter" },
        limit: {
          type: "integer",
          minimum: 1,
          maximum: 100,
          description: "Maximum tools to return (default 50)",
        },
      },
    },
  },
  {
    name: "add_tool",
    description:
      "Add a tool to the approval queue using supplied details. It remains pending and is not published until an administrator approves it.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Tool name" },
        description: { type: "string", description: "Short tool description" },
        category: { type: "string", description: "Directory category" },
        url: { type: "string", description: "Official website URL" },
        type: { type: "string", description: "Tool type, such as Web App or API" },
        tags: {
          type: "array",
          items: { type: "string" },
          maxItems: 8,
          description: "Optional discovery tags",
        },
        logo: { type: "string", description: "Optional logo URL or emoji" },
        pricing: { type: "string", description: "Optional pricing model" },
        notes: { type: "string", description: "Optional reviewer notes" },
      },
      required: ["title", "description", "category", "url"],
    },
  },
  {
    name: "update_tool",
    description:
      "Stage partial changes to an existing tool for human approval. The live tool is never modified unless the submission is approved.",
    inputSchema: {
      type: "object",
      properties: {
        listing_id: { type: "string", description: "Existing directory tool ID" },
        title: { type: "string", description: "Replacement tool name" },
        description: { type: "string", description: "Replacement description" },
        category: { type: "string", description: "Replacement category" },
        url: { type: "string", description: "Replacement official URL" },
        type: { type: "string", description: "Replacement tool type" },
        tags: {
          type: "array",
          items: { type: "string" },
          maxItems: 8,
          description: "Complete replacement tag list",
        },
        logo: { type: "string", description: "Replacement logo URL or emoji" },
        pricing: { type: "string", description: "Replacement pricing model" },
        notes: { type: "string", description: "Reason or evidence for the proposed changes" },
      },
      required: ["listing_id"],
    },
  },
  {
    name: "preview_listing",
    description:
      "Extract and normalize listing data from a website without creating a submission.",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string", description: "Official website URL" },
      },
      required: ["url"],
    },
  },
  {
    name: "submit_listing",
    description:
      "Submit a website to the directory review queue. The website is automatically enriched and never published without approval.",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string", description: "Official website URL" },
        notes: { type: "string", description: "Optional context for the reviewer" },
      },
      required: ["url"],
    },
  },
  {
    name: "suggest_listing_update",
    description: "Submit an automatically enriched update for an existing listing.",
    inputSchema: {
      type: "object",
      properties: {
        listing_id: { type: "string", description: "Existing directory listing ID" },
        url: { type: "string", description: "Official URL to re-import" },
        notes: { type: "string", description: "What changed and why" },
      },
      required: ["listing_id", "url"],
    },
  },
  {
    name: "claim_listing",
    description: "Request ownership of an existing listing. An administrator must approve the claim.",
    inputSchema: {
      type: "object",
      properties: {
        listing_id: { type: "string", description: "Existing directory listing ID" },
        url: { type: "string", description: "Official website URL" },
        notes: { type: "string", description: "Evidence or context supporting the claim" },
      },
      required: ["listing_id", "url"],
    },
  },
  {
    name: "get_submission_status",
    description: "Get the review status of a submission created by this authenticated integration.",
    inputSchema: {
      type: "object",
      properties: {
        submission_id: { type: "string", description: "Submission ID returned by another tool" },
      },
      required: ["submission_id"],
    },
  },
] as const;

export async function POST(request: Request) {
  let body: JsonRpcRequest;
  try {
    body = (await request.json()) as JsonRpcRequest;
  } catch {
    return rpcError(null, -32700, "Parse error", 400);
  }

  if (body.jsonrpc !== "2.0" || !body.method) {
    return rpcError(body.id, -32600, "Invalid Request", 400);
  }

  if (body.method === "initialize") {
    return rpcResult(body.id, {
      protocolVersion: "2025-06-18",
      capabilities: { tools: { listChanged: false } },
      serverInfo: {
        name: "antigravity-directory",
        version: "1.0.0",
      },
    });
  }

  if (body.method === "notifications/initialized") {
    return new Response(null, { status: 202 });
  }

  if (body.method === "ping") {
    return rpcResult(body.id, {});
  }

  if (body.method === "tools/list") {
    return rpcResult(body.id, { tools });
  }

  if (body.method !== "tools/call") {
    return rpcError(body.id, -32601, "Method not found");
  }

  const apiKey = getBearerToken(request);
  if (!apiKey) {
    return rpcError(body.id, -32001, "Bearer authentication is required", 401);
  }

  const params = asObject(body.params);
  const toolName = typeof params.name === "string" ? params.name : "";
  const toolArgs = asObject(params.arguments);
  const convex = getConvexClient();

  try {
    let result: unknown;
    if (toolName === "list_tools") {
      result = await convex.action(api.submissions.listToolsFromIntegration, {
        apiKey,
        search: optionalString(toolArgs, "search"),
        category: optionalString(toolArgs, "category"),
        limit: optionalInteger(toolArgs, "limit"),
      });
    } else if (toolName === "add_tool") {
      result = await convex.action(api.submissions.addToolFromIntegration, {
        apiKey,
        title: requiredString(toolArgs, "title"),
        description: requiredString(toolArgs, "description"),
        category: requiredString(toolArgs, "category"),
        url: requiredString(toolArgs, "url"),
        type: optionalString(toolArgs, "type"),
        tags: optionalStringArray(toolArgs, "tags"),
        logo: optionalString(toolArgs, "logo"),
        pricing: optionalString(toolArgs, "pricing"),
        notes: optionalString(toolArgs, "notes"),
      });
    } else if (toolName === "update_tool") {
      result = await convex.action(api.submissions.updateToolFromIntegration, {
        apiKey,
        targetToolId: requiredString(toolArgs, "listing_id") as Id<"tools">,
        title: optionalString(toolArgs, "title"),
        description: optionalString(toolArgs, "description"),
        category: optionalString(toolArgs, "category"),
        url: optionalString(toolArgs, "url"),
        type: optionalString(toolArgs, "type"),
        tags: optionalStringArray(toolArgs, "tags"),
        logo: optionalString(toolArgs, "logo"),
        pricing: optionalString(toolArgs, "pricing"),
        notes: optionalString(toolArgs, "notes"),
      });
    } else if (toolName === "preview_listing") {
      result = await convex.action(api.submissions.previewListingFromIntegration, {
        apiKey,
        url: requiredString(toolArgs, "url"),
      });
    } else if (toolName === "submit_listing") {
      result = await convex.action(api.submissions.submitListingFromIntegration, {
        apiKey,
        url: requiredString(toolArgs, "url"),
        notes: optionalString(toolArgs, "notes"),
        kind: "create",
      });
    } else if (toolName === "suggest_listing_update" || toolName === "claim_listing") {
      result = await convex.action(api.submissions.submitListingFromIntegration, {
        apiKey,
        url: requiredString(toolArgs, "url"),
        notes: optionalString(toolArgs, "notes"),
        kind: toolName === "claim_listing" ? "claim" : "update",
        targetToolId: requiredString(toolArgs, "listing_id") as Id<"tools">,
      });
    } else if (toolName === "get_submission_status") {
      result = await convex.action(api.submissions.getSubmissionStatusFromIntegration, {
        apiKey,
        submissionId: requiredString(toolArgs, "submission_id") as Id<"submissions">,
      });
    } else {
      return rpcError(body.id, -32602, `Unknown tool: ${toolName}`);
    }

    return rpcResult(body.id, {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      structuredContent: result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Tool call failed";
    return rpcResult(body.id, {
      content: [{ type: "text", text: message }],
      isError: true,
    });
  }
}

export function GET() {
  return Response.json({
    name: "Antigravity Directory MCP",
    endpoint: "/api/mcp",
    authentication: "Bearer",
    tools: tools.map((tool) => tool.name),
  });
}
