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

const tools = [
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
    if (toolName === "preview_listing") {
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
