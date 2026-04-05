# Ingestion API — coupling & SOLID improvement backlog

## Document type (vs ADR)

This file is **not** an Architecture Decision Record (ADR).

| | ADR (e.g. `docs/adr/0001-…`) | This document |
|---|------------------------------|---------------|
| **Purpose** | Record an architectural **decision** (what we chose and why). | Record **possible refactorings** and technical debt to implement later. |
| **Status** | Proposed → Accepted / Deprecated / Superseded. | Open backlog; items close when implemented or rejected. |
| **When to add** | After (or while) choosing between real alternatives. | Anytime you want a durable checklist from analysis. |

**When to promote to an ADR:** After you pick a concrete approach (e.g. “notifier port + adapter”, “shared Redis module shape”), add **ADR-0009** (next free number) with Context / Decision / Consequences, and link it from the relevant item below.

## Background

Derived from a codebase review of `apps/ingestion-api` focused on **coupling** and **SOLID** (worker ↔ realtime layer, Redis usage, globals, typing, cross-cutting config).

## Implementation status

| Item | Status |
|------|--------|
| 1. `JobCompletedNotifier` port | Done — `src/metrics/job-completed-notifier.ts`; `WebhookProcessor` injects token; `MetricsGateway` implements. |
| 2. `@Global()` on `MetricsModule` | Done — removed; `WorkerModule` imports `MetricsModule` explicitly. |
| 3. Centralize Redis (app client) | Done — `RedisModule` + `REDIS_CLIENT`; `IdempotencyService` + `RedisHealthIndicator` share client; `RedisShutdownHook` quits on shutdown. BullMQ remains separate (documented in module). |
| 4. CORS single path | Done — `src/config/cors-options.ts`; `main.ts` + `MetricsGateway`. |
| 5. `AppService` DB typing | Done — uses `DatabaseConnection` from `database.module`. |
| 6. Insert vs idempotency ordering | Done — documented in `WebhookProcessor` class JSDoc. |
| 7. Log payload / PII | Done — `Processing webhook` log omits `data` field. |
| 8. `isHealthy` naming | Done — `DatabaseHealthIndicator.isHealthy`. |

## Improvement items

### 1. Decouple worker from `MetricsGateway` (DIP / layering)

- **Issue:** `WebhookProcessor` depends on concrete `MetricsGateway` (`src/metrics/metrics.gateway.ts`); processing is tied to Socket.io.
- **Direction:** Introduce a narrow abstraction (e.g. `WebhookJobCompletedNotifier` / port) with `emitJobCompleted(event: JobCompletedEvent): void`; `MetricsGateway` implements it. `WorkerModule` should **explicitly** import a module that registers the binding instead of relying only on `@Global()` `MetricsModule`.
- **Acceptance:** Processor unit tests mock the port; swapping transport does not require editing processor logic.

### 2. Revisit `@Global()` on `MetricsModule`

- **Issue:** Global export hides the worker’s dependency graph.
- **Direction:** Prefer explicit imports once a port/adapter split exists; keep global only if there is a strong, documented reason.
- **Acceptance:** Module graph shows clear provider of the notifier to `WorkerModule`.

### 3. Centralize Redis connections (DRY / DIP)

- **Issue:** Separate `ioredis` instances in `IdempotencyService` and `RedisHealthIndicator`, plus BullMQ’s own connection — duplicated config and extra clients.
- **Direction:** Single injectable Redis factory or shared client module; reuse or document why BullMQ and idempotency cannot share a connection.
- **Acceptance:** One place reads `REDIS_HOST` / `REDIS_PORT` for app-owned clients; health and idempotency inject the same abstraction.

### 4. Unify CORS / allowed origins configuration

- **Issue:** `main.ts` (Fastify CORS) and `MetricsGateway` both apply CORS / `ALLOWED_ORIGINS` defaults.
- **Direction:** One config helper or `ConfigService` keys consumed by both bootstrap paths.
- **Acceptance:** Changing allowed origins requires a single code path.

### 5. Align `AppService` database typing with `DatabaseModule`

- **Issue:** `DatabaseModule` exposes `PostgresJsDatabase<{ webhookEvents }>`; `AppService` types injection with full package schema — type drift risk.
- **Direction:** Use the same exported `DatabaseConnection` type everywhere, or widen the module schema intentionally with a comment.
- **Acceptance:** No conflicting `PostgresJsDatabase<…>` shapes for the same token.

### 6. Optional: transactional / ordering semantics (document or harden)

- **Issue:** Insert then Redis `markProcessed` is not atomic; failure between steps can leave odd edge cases.
- **Direction:** Either document accepted risk for this lab or introduce a deliberate ordering / compensation strategy (may warrant a small ADR if non-trivial).

### 7. Optional: logging of webhook payloads

- **Issue:** `WebhookProcessor` logs full `job.data` including `data` — potential PII / secret leakage in logs.
- **Direction:** Log identifiers only, or redact/hash payload fields in production.

### 8. Naming consistency (health indicators)

- **Issue:** `DatabaseHealthIndicator.isHealth` vs `RedisHealthIndicator.isHealthy`.
- **Direction:** Rename for consistency (breaking change only to internal API).

## Suggested implementation order

1. Items **3** and **4** (infrastructure clarity, low behavioral risk if done carefully).  
2. Items **1** and **2** (structure / testability).  
3. Items **5**, **8** (typing and polish).  
4. Items **6**, **7** (product/security policy).

## References

- Code: `apps/ingestion-api/src/` (`webhook/`, `worker/`, `metrics/`, `health/`, `database/`, `app.module.ts`, `main.ts`)
- Existing ADRs: [docs/adr/README.md](./adr/README.md) (e.g. queue-based processing, Fastify adapter)
