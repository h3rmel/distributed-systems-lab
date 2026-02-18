# Stage 1: Base - Node.js runtime
FROM node:24-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Stage 2: Dependencies - Install all dependencies
FROM base AS dependencies

# Copy workspace configuration files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy package.json files for all workspaces
COPY packages/dto/package.json ./packages/dto/
COPY packages/database/package.json ./packages/database/
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY apps/ingestion-api/package.json ./apps/ingestion-api/

# Install all dependencies (including dev dependencies for build)
RUN pnpm install --frozen-lockfile

# Stage 3: Builder - Build all packages and the app
FROM dependencies AS builder

# Copy source files for shared packages
COPY packages/dto ./packages/dto
COPY packages/database ./packages/database
COPY packages/eslint-config ./packages/eslint-config

# Copy source files for ingestion-api
COPY apps/ingestion-api ./apps/ingestion-api

# Copy root TypeScript config (if needed for builds)
COPY tsconfig.json ./

# Build shared packages first
RUN pnpm --filter @distributed-systems-lab/dto build
RUN pnpm --filter @distributed-systems-lab/database build

# Build ingestion-api
WORKDIR /app/apps/ingestion-api
RUN pnpm build

# Stage 4: Runner - Production image with only runtime dependencies
FROM base AS runner

WORKDIR /app

# Copy workspace configuration
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy package.json files
COPY packages/dto/package.json ./packages/dto/
COPY packages/database/package.json ./packages/database/
COPY apps/ingestion-api/package.json ./apps/ingestion-api/

# Install only production dependencies
RUN pnpm install --frozen-lockfile --prod

# Copy built artifacts from builder stage
COPY --from=builder /app/packages/dto/dist ./packages/dto/dist
COPY --from=builder /app/packages/dto/package.json ./packages/dto/
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/database/package.json ./packages/database/
COPY --from=builder /app/apps/ingestion-api/dist ./apps/ingestion-api/dist
COPY --from=builder /app/apps/ingestion-api/package.json ./apps/ingestion-api/

# Set working directory to ingestion-api
WORKDIR /app/apps/ingestion-api

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Run the application
CMD ["node", "dist/main.js"]

