FROM node:18-bullseye-slim AS base

# Install dependencies only when needed
FROM base AS deps
RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    procps \
    curl \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN ./node_modules/.bin/prisma generate

# Build the application
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    procps \
    dumb-init \
    curl \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 --shell /bin/sh nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.bin ./node_modules/.bin
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma
COPY docker-entrypoint.sh ./docker-entrypoint.sh

RUN chown nextjs:nodejs .next
RUN chmod +x ./docker-entrypoint.sh

USER nextjs

EXPOSE 3000


ENV PORT 3000
ENV HOSTNAME "0.0.0.0"
ENV NODE_OPTIONS="--max-old-space-size=1024 --expose-gc"

# Use dumb-init to handle signals properly (prevents zombie processes)
ENTRYPOINT ["dumb-init", "--", "./docker-entrypoint.sh"]
CMD ["node", "server.js"]