# Stage 1: Base
FROM node:25-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Stage 2: Dependencies
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# Stage 3: Development
FROM base AS development
ENV NODE_ENV=development
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Next.js dev server runs on 3000 by default, but we'll map it in compose
EXPOSE 3000
CMD ["npm", "run", "dev"]

# Stage 4: Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Skip env validation during build
ENV SKIP_ENV_VALIDATION=true
ENV NODE_ENV=production

RUN npm run build

# Stage 5: Runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Environment variables should be passed at runtime using --env-file or compose

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
RUN mkdir .next && chown nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
