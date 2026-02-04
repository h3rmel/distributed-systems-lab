# ============================================
# Stage 1: Base
# ============================================
FROM node:20-alpine AS base

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# ============================================
# Stage 2: Dependencies
# ============================================
FROM base AS dependencies

# Copy workspace configuration files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy package.json files for all workspaces needed
COPY packages/database/package.json ./packages/database/
COPY apps/stream-api/package.json ./apps/stream-api/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# ============================================
# Stage 3: Builder
# ============================================
FROM dependencies AS builder

# Copy source files
COPY packages/database ./packages/database
COPY apps/stream-api ./apps/stream-api
COPY tsconfig.json ./

# Build shared packages first
RUN pnpm --filter @distributed-systems-lab/database build

# Build stream-api
WORKDIR /app/apps/stream-api
RUN pnpm build

# ============================================
# Stage 4: Runner
# ============================================
FROM base AS runner

WORKDIR /app

# Copy workspace configuration
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy package.json files
COPY packages/database/package.json ./packages/database/
COPY apps/stream-api/package.json ./apps/stream-api/

# Install only production dependencies
RUN pnpm install --frozen-lockfile --prod

# Copy built artifacts
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/database/package.json ./packages/database/
COPY --from=builder /app/apps/stream-api/dist ./apps/stream-api/dist
COPY --from=builder /app/apps/stream-api/package.json ./apps/stream-api/

WORKDIR /app/apps/stream-api

EXPOSE 3002

CMD ["node", "dist/server.js"]