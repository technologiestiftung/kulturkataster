# Use the official Node.js 24 image as base
FROM node:24-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts && npm cache clean --force

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Accept NEXT_PUBLIC_BRANCH build argument (needed for client-side Footer)
ARG NEXT_PUBLIC_BRANCH=""
ENV NEXT_PUBLIC_BRANCH=$NEXT_PUBLIC_BRANCH

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/docs/getting-started
# Uncomment the following line in case you want to disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED=1

RUN --mount=type=cache,id=nextjs-build-cache,target=/app/.next/cache \
    npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Set runtime environment variables for Supabase and Traduora
ARG SUPABASE_URL=""
ARG SUPABASE_ANON_KEY=""
ARG MAPTILER_API_KEY=""
ARG MAP_BOUNDING_BOX=""
ARG NEXT_PUBLIC_BRANCH=""

ARG TRADUORA_API_URL=""
ARG TRADUORA_CLIENT_ID=""
ARG TRADUORA_CLIENT_SECRET=""
ARG TRADUORA_PROJECT_ID=""

ENV SUPABASE_URL=$SUPABASE_URL
ENV SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
ENV MAPTILER_API_KEY=$MAPTILER_API_KEY
ENV MAP_BOUNDING_BOX=$MAP_BOUNDING_BOX
ENV NEXT_PUBLIC_BRANCH=$NEXT_PUBLIC_BRANCH

ENV TRADUORA_API_URL=$TRADUORA_API_URL
ENV TRADUORA_CLIENT_ID=$TRADUORA_CLIENT_ID
ENV TRADUORA_CLIENT_SECRET=$TRADUORA_CLIENT_SECRET
ENV TRADUORA_PROJECT_ID=$TRADUORA_PROJECT_ID

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]