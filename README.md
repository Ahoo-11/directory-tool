# Welcome to your Convex + Next.js app

This is a [Convex](https://convex.dev/) project created with [`npm create convex`](https://www.npmjs.com/package/create-convex).

After the initial setup (<2 minutes) you'll have a working full-stack app using:

- Convex as your backend (database, server logic)
- [React](https://react.dev/) as your frontend (web page interactivity)
- [Next.js](https://nextjs.org/) for optimized web hosting and page routing
- [Tailwind](https://tailwindcss.com/) for building great looking accessible UI

## Get started

If you just cloned this codebase and didn't use `npm create convex`, run:

```
npm install
npm run dev
```

If you're reading this README on GitHub and want to use this template, run:

```
npm create convex@latest -- -t nextjs
```

## Learn more

To learn more about developing your project with Convex, check out:

- The [Tour of Convex](https://docs.convex.dev/get-started) for a thorough introduction to Convex principles.
- The rest of [Convex docs](https://docs.convex.dev/) to learn about all Convex features.
- [Stack](https://stack.convex.dev/) for in-depth articles on advanced topics.

## Automated listing intake

Signed-in users can submit a website URL from the home page. The backend extracts
the listing details, checks for duplicates, records who submitted it, and places
it in the approval queue at `/submissions`. Only an administrator can publish,
reject, or request changes.

Firecrawl enrichment is optional. Configure it in the Convex runtime:

```powershell
npx convex env set FIRECRAWL_API_KEY fc-your-key
```

Without Firecrawl, the importer uses the website's public HTML metadata.

## MCP submission API

The stateless MCP endpoint is available at `/api/mcp` and provides:

- `submit_listing`
- `preview_listing`
- `suggest_listing_update`
- `claim_listing`
- `get_submission_status`

Configure one client:

```powershell
npx convex env set DIRECTORY_MCP_API_KEY replace-with-a-long-random-secret
```

Or configure named clients. The matching JSON key is stored as the immutable
integration identity on every submission:

```powershell
npx convex env set DIRECTORY_MCP_API_KEYS '{"agenthub":"secret-one","partner-a":"secret-two"}'
```

Clients authenticate with `Authorization: Bearer <secret>`.

## Join the community

Join thousands of developers building full-stack apps with Convex:

- Join the [Convex Discord community](https://convex.dev/community) to get help in real-time.
- Follow [Convex on GitHub](https://github.com/get-convex/), star and contribute to the open-source implementation of Convex.
