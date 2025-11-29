# Dockerfile for Next.js 15 application with monorepo structure
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files from both root and app directory
COPY package*.json ./
COPY app/package*.json ./app/

# Install dependencies in both locations
RUN npm ci --only=production --ignore-scripts
RUN cd app && npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Copy node_modules from deps
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/app/node_modules ./app/node_modules

# Copy all source files
COPY . .

# Generate Prisma Client
RUN cd app && npx prisma generate

# Build the Next.js application
RUN cd app && npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/app/public ./app/public

# Set the correct permission for prerender cache
RUN mkdir -p ./app/.next
RUN chown nextjs:nodejs ./app/.next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/app/.next/static ./app/.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the Next.js application
CMD ["node", "app/server.js"]
