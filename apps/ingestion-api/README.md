# Ingestion API

High-throughput webhook ingestion system built with NestJS 11 + FastifyAdapter + BullMQ. Accepts webhooks from payment providers, queues them asynchronously, and persists to PostgreSQL with idempotency guarantees.

## KPIs

| Metric             | Target  | Achieved                       |
| ------------------ | ------- | ------------------------------ |
| Virtual Users      | 500     | 499                            |
| Error Rate         | < 1%    | **0.00%**                      |
| P95 Latency        | < 100ms | **7.35ms**                     |
| Data Consistency   | 100%    | **184,849 req = 184,849 rows** |
| Unit Test Coverage | 80%+    | **97.77%**                     |

## Architecture

```
HTTP POST /webhooks/:provider
    │
    ▼
┌─────────────────────┐
│  WebhookController   │  Validates DTO, returns 202
│  (ValidationPipe)    │
└──────────┬──────────┘
           │ enqueue
           ▼
┌─────────────────────┐     ┌─────────────────────┐
│  BullMQ Queue        │────►│  WebhookProcessor    │
│  (Redis-backed)      │     │  (Background Worker)  │
└─────────────────────┘     └──────────┬──────────┘
                                       │
                            ┌──────────▼──────────┐
                            │  IdempotencyService   │
                            │  (Redis 24h TTL)      │
                            └──────────┬──────────┘
                                       │ if new
                                       ▼
                            ┌─────────────────────┐
                            │  PostgreSQL           │
                            │  (Drizzle ORM)        │
                            └─────────────────────┘
                                       │
                            ┌──────────▼──────────┐
                            │  MetricsGateway       │
                            │  (Socket.io → Dashboard)│
                            └─────────────────────┘
```

## Modules

| Module           | Responsibility                                                         |
| ---------------- | ---------------------------------------------------------------------- |
| `AppModule`      | Root module, ConfigModule, LoggerModule (nestjs-pino), BullModule      |
| `DatabaseModule` | Drizzle ORM + PostgreSQL connection pool (`DATABASE_CONNECTION` token) |
| `QueueModule`    | BullMQ queue registration (`webhooks`) with retry/backoff config       |
| `WebhookModule`  | Controller + Service for webhook ingestion (HTTP 202 + enqueue)        |
| `WorkerModule`   | BullMQ Processor + IdempotencyService (Redis dedup with 24h TTL)       |
| `HealthModule`   | Terminus health checks: database, Redis, memory heap                   |
| `MetricsModule`  | Socket.io WebSocket gateway — emits `job-completed` events             |

## API Reference

### `POST /webhooks/:provider`

Ingest a webhook event for asynchronous processing.

**Request:**

```json
{
  "eventId": "evt_abc123",
  "timestamp": "2026-01-01T00:00:00.000Z",
  "data": { "type": "payment_intent.succeeded", "amount": 4200 }
}
```

**Response:** `202 Accepted`

```json
{
  "accepted": true,
  "jobId": "1"
}
```

### `GET /health`

Terminus health check (database, Redis, memory heap).

**Response:** `200 OK`

```json
{
  "status": "ok",
  "info": {
    "database": { "status": "up" },
    "redis": { "status": "up" },
    "memory_heap": { "status": "up" }
  }
}
```

## WebSocket Events

| Event           | Direction       | Payload                                                   |
| --------------- | --------------- | --------------------------------------------------------- |
| `job-completed` | Server → Client | `{ jobId, eventId, provider, processingTime, timestamp }` |

Connect via Socket.io to the API base URL (port 3001).

## Configuration

| Variable                     | Default                 | Description                         |
| ---------------------------- | ----------------------- | ----------------------------------- |
| `PORT`                       | `3001`                  | HTTP listen port                    |
| `DB_HOST`                    | —                       | PostgreSQL host (required)          |
| `DB_PORT`                    | —                       | PostgreSQL port (required)          |
| `DB_USER`                    | —                       | PostgreSQL user (required)          |
| `DB_PASSWORD`                | —                       | PostgreSQL password (required)      |
| `DB_NAME`                    | —                       | PostgreSQL database (required)      |
| `REDIS_HOST`                 | `localhost`             | Redis host                          |
| `REDIS_PORT`                 | `6379`                  | Redis port                          |
| `ALLOWED_ORIGINS`            | `http://localhost:3000` | CORS origins (comma-separated)      |
| `RATE_LIMIT_MAX`             | `100`                   | Max requests per minute             |
| `DISABLE_WEBHOOK_RATE_LIMIT` | `false`                 | Bypass rate limit for `/webhooks/*` |
| `LOG_LEVEL`                  | `info`                  | Pino log level                      |
| `NODE_ENV`                   | `development`           | `production` disables pino-pretty   |

## Development

```bash
# Prerequisites: Docker services running
pnpm docker:up

# Watch mode
pnpm dev

# Build
pnpm build

# Start production
pnpm start:prod
```

## Testing

```bash
# Unit tests (Jest)
pnpm test

# Coverage report
pnpm test:cov

# E2E tests (requires running services)
pnpm test:e2e

# K6 load test (requires k6 v1.5+)
pnpm test:load
```

### Test Structure

- **Unit tests** (`src/**/*.spec.ts`): 11 files, 55 tests — Jest + `@nestjs/testing`
- **E2E tests** (`test/*.e2e-spec.ts`): App routes, WebSocket gateway flow
- **Load tests** (`test/load-test.ts`): K6, 500 VUs, ramp profile

## Docker

```bash
# Build and run via docker compose
docker compose up ingestion-api

# Standalone build
docker build -f apps/ingestion-api/Dockerfile -t ingestion-api .
```

Multi-stage Dockerfile: `node:24-alpine`, pnpm workspace install, NestJS build, production-only deps.

## Key Decisions

- [ADR-0001: FastifyAdapter over ExpressAdapter](../../docs/adr/0001-use-fastify-adapter-over-express.md)
- [ADR-0002: Queue-Based Asynchronous Processing](../../docs/adr/0002-queue-based-asynchronous-processing.md)
- [ADR-0003: Drizzle ORM over TypeORM/Prisma](../../docs/adr/0003-use-drizzle-orm-over-typeorm-prisma.md)
