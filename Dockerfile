# Dockerfile for Next.js 15 application with monorepo structure
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Copy package files from both root and app directory
COPY package*.json ./
COPY app/package*.json ./app/

# Install ALL dependencies (including devDependencies needed for build)
RUN npm ci --ignore-scripts
RUN cd app && npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Copy node_modules from deps
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/app/node_modules ./app/node_modules

# Copy all source files
COPY . .

# Copy Prisma schema and generate client
COPY app/prisma ./app/prisma
RUN cd app && npx prisma generate

# Build the Next.js application
ENV NEXT_TELEMETRY_DISABLED=1
RUN cd app && npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN apk add --no-cache openssl

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone output
COPY --from=builder --chown=nextjs:nodejs /app/app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/app/.next/static ./app/.next/static

# Set up public directory (create if doesn't exist)
RUN mkdir -p ./app/public

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the Next.js application
CMD ["node", "app/server.js"]
