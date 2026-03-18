# Stage 1: Base - Node.js runtime
FROM node:24-alpine AS base

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Stage 2: Dependencies - Install all dependencies
FROM base AS dependencies

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

COPY packages/dto/package.json ./packages/dto/
COPY apps/live-dashboard/package.json ./apps/live-dashboard/

RUN pnpm install --frozen-lockfile

# Stage 3: Builder - Build packages and app
FROM dependencies AS builder

ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

COPY packages/dto ./packages/dto
COPY apps/live-dashboard ./apps/live-dashboard
COPY tsconfig.json ./

RUN pnpm --filter @distributed-systems-lab/dto build

WORKDIR /app/apps/live-dashboard
RUN pnpm build

# Stage 4: Runner - Minimal production image
FROM base AS runner

ENV NODE_ENV=production

WORKDIR /app

COPY --from=builder /app/apps/live-dashboard/.next/standalone ./
COPY --from=builder /app/apps/live-dashboard/.next/static ./apps/live-dashboard/.next/static
COPY --from=builder /app/apps/live-dashboard/public ./apps/live-dashboard/public

WORKDIR /app/apps/live-dashboard

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "server.js"]
