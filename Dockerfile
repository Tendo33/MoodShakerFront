FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat && corepack enable && corepack prepare pnpm@10.9.0 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
# The build never touches the database; pages that read it are rendered per request.
RUN pnpm build

FROM node:22-alpine AS runner
WORKDIR /app
RUN apk add --no-cache libc6-compat && corepack enable && corepack prepare pnpm@10.9.0 --activate

ENV NODE_ENV=production PORT=3000

# Production deps only. tsx stays a dependency because the entrypoint runs the
# TypeScript migrate and seed scripts; Playwright, eslint, and the rest do not.
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod && chown -R node:node /app

COPY --from=builder --chown=node:node /app/next.config.mjs /app/tsconfig.json ./
COPY --from=builder --chown=node:node /app/.next ./.next
COPY --from=builder --chown=node:node /app/public ./public
# Migrations and seed run at start-up (see docker-entrypoint.sh).
COPY --from=builder --chown=node:node /app/drizzle ./drizzle
COPY --from=builder --chown=node:node /app/scripts ./scripts
COPY --from=builder --chown=node:node /app/lib ./lib

USER node
EXPOSE 3000

# /api/health, not /: it returns 503 while the database is unreachable, so a
# container that lost its database stops taking traffic. The timeout must stay
# above the endpoint's own 12s check; retries and start-period absorb a
# serverless database waking up.
HEALTHCHECK --interval=30s --timeout=15s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["./scripts/docker-entrypoint.sh"]
