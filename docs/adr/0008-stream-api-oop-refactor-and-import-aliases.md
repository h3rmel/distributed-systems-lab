# ADR-0008: Stream API OOP Refactor and Import Aliases

## Status

Accepted

## Context

The Stream API (`apps/stream-api`) was built incrementally across Phases 3.1–3.14 using a functional programming style with module-level singletons. While functional and passing all acceptance criteria (5M rows, 57MB avg memory, 48.7k rows/sec), two structural issues have emerged now that the project is feature-complete:

### Problem 1: Module-Level Singletons Violate DI Principle

The codebase has 4 singletons instantiated at import time:

- `s3Client` in `storage/storage.service.ts` — S3 connection created on `import`
- `redis` in `notifications/redis.client.ts` — ioredis connection created on `import`
- `webhookQueue` / `webhookWorker` in `notifications/webhook.queue.ts` / `webhook.worker.ts` — BullMQ Queue and Worker created on `import`
- `pool` in `streams/postgres-writer.ts` — pg Pool created on `import`

This causes:

1. **No initialization control** — importing `notifications/index.ts` immediately creates a Redis connection, a BullMQ Queue, and a BullMQ Worker with no way to control order or defer creation.
2. **Untestable** — services cannot be mocked without module-level monkey-patching.
3. **Implicit coupling** — `uploadFileToS3()` silently depends on the `s3Client` singleton from a sibling file. The dependency graph is invisible.
4. **Violates project rules** — the monorepo standard mandates "Dependency Injection required (no global singletons)".

### Problem 2: Relative Import Paths

All 13 source files use relative imports (`../storage/index.js`, `../../notifications/types`). As the module count grows, deep relative paths become error-prone and hard to read. There is also inconsistent `.js` extension usage across files.

**Alternatives considered for DI:**

1. **Keep FP + pass dependencies as function parameters** — Low friction but verbose; every function gains 2–4 extra parameters. Becomes unwieldy with 4+ services.
2. **Lightweight DI container (tsyringe/awilix)** — Adds a dependency; overkill for a Fastify app with ~6 services.
3. **OOP classes + manual composition root** — Zero dependencies, explicit wiring in `server.ts`, testable via constructor injection. Consistent with `ingestion-api` patterns (NestJS uses classes).
4. **Fastify DI plugin (`fastify-awilix`)** — Framework-specific coupling, adds dependency.

**Alternatives considered for import aliases:**

1. **Keep relative paths** — Zero config but degrading readability.
2. **`@/*` path alias via `tsconfig.json` paths** — Standard convention, supported by both `tsup` (esbuild) and `tsx` natively. No additional dependencies.
3. **Per-module aliases (`@storage/*`, `@notifications/*`)** — Over-engineered for current module count.

## Decision

We will perform a two-part structural refactor of `stream-api`:

### Part A: Import Aliases (`@/*`)

Add `baseUrl` and `paths` to `apps/stream-api/tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**Convention:** Use `@/` for cross-module imports (routes → notifications, routes → storage). Keep `./` for intra-module imports (e.g., `redis.client` → `types` within `notifications/`).

**Toolchain:** Both `tsup` (build, esbuild-based) and `tsx` (dev, esbuild-based) resolve `tsconfig.json` paths natively. No plugins or additional dependencies required.

### Part B: OOP Refactor with Manual Composition Root

Convert standalone functions with module-level singletons into classes with explicit lifecycle management:

| Class | Replaces | Injected Dependencies |
|-------|----------|-----------------------|
| `StorageService` | `storage/*.ts` (4 files) | S3 config (env-based) |
| `RedisClient` | `redis.client.ts` | Redis config (env-based) |
| `StatusService` | `status.service.ts` | `RedisClient` |
| `WebhookQueue` | `webhook.queue.ts` | Redis config |
| `WebhookWorker` | `webhook.worker.ts` | Redis config |
| `DatabaseService` | `postgres-writer.ts` | DB config (env-based) |
| `MemoryMonitor` | `memory.ts` | Interval config |

**DI strategy:** Manual composition root in `server.ts`. No DI framework.

```
server.ts (composition root)
├── creates RedisClient
├── creates StorageService
├── creates StatusService(RedisClient)
├── creates WebhookQueue(redisConfig)
├── creates WebhookWorker(redisConfig)
├── creates DatabaseService
├── creates MemoryMonitor
├── decorates Fastify app with service instances
├── registers route plugins (routes access services via app context)
└── orchestrates graceful shutdown (worker → queue → redis → db → app)
```

**Unchanged:** `ValidationTransform` and `FormatterTransform` are already classes extending Node.js `Transform` — no modification needed.

## Consequences

### Positive

- **Testability** — All services injectable via constructor; unit tests pass mock implementations without module patching.
- **Explicit lifecycle** — Each service has `connect()`/`close()` methods. Initialization order is visible in `server.ts`.
- **DI compliance** — Eliminates all 4 module-level singletons. Aligns with monorepo engineering standards.
- **Readable imports** — `@/notifications/status.service` vs `../../../notifications/status.service`. Fixes `.js` extension inconsistency.
- **Consistency** — OOP pattern matches `ingestion-api` (NestJS classes). Same mental model across the monorepo.
- **Zero new dependencies** — `tsconfig.json` paths + manual composition root. No DI framework added.

### Negative

- **Refactor scope** — ~13 files affected. Must re-verify OOM test after refactor to confirm no performance regression.
- **Boilerplate** — Classes require constructor, fields, and explicit typing (mitigated by strict TypeScript benefits).
- **Fastify decoration** — Route plugins access services via `app.serviceX` instead of direct imports. Requires Fastify type augmentation for type safety.

### Implementation Notes

- **Execution order:** Import aliases first (smaller, no behavior change), then OOP refactor (uses aliased imports from the start).
- **Verification:** Re-run OOM test (5M rows in 512MB container) after refactor to confirm identical performance profile.
- **Files affected:** `server.ts`, all `routes/*.ts`, all `storage/*.ts`, all `notifications/*.ts`, `streams/postgres-writer.ts`, `monitoring/memory.ts`, barrel `index.ts` files.

## References

- [SPEC-STREAM-API.md](../SPEC-STREAM-API.md)
- [ADR-0007: Notification System](./0007-notification-system-for-stream-api.md)
