# syntax=docker/dockerfile:1

# Use Node 22 Alpine as base for all stages
FROM node:22-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Optional public build arguments for non-Server-Agent builds
ARG NEXT_PUBLIC_CONVEX_URL
ARG NEXT_PUBLIC_STACK_PROJECT_ID
ARG NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY

ENV NEXT_PUBLIC_CONVEX_URL=${NEXT_PUBLIC_CONVEX_URL}
ENV NEXT_PUBLIC_STACK_PROJECT_ID=${NEXT_PUBLIC_STACK_PROJECT_ID}
ENV NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=${NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY}

# Disable Next.js telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1

# Server Agent creates .env before the image build. Bind it only for this RUN
# instruction so secrets are available to Convex but never copied into an image
# layer. Other builders can continue using the public ARG values above.
RUN --mount=type=bind,source=.,target=/run/build-context,ro \
    if [ -f /run/build-context/.env ]; then \
      set -a && . /run/build-context/.env && set +a && \
      if [ -n "$CONVEX_DEPLOY_KEY" ]; then \
        echo "Deploying Convex functions and building the application..." && \
        npx convex deploy --cmd "npm run build"; \
      else \
        echo "Building with configured public environment..." && \
        npm run build; \
      fi; \
    else \
      echo "No Server Agent environment file found; building with Docker ARG values..." && \
      npm run build; \
    fi

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
