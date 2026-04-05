# Stream API — coupling & SOLID improvement backlog

## Document type (vs ADR)

This file is **not** an Architecture Decision Record (ADR). It is a **backlog** of possible refactorings. When you choose a concrete design (e.g. “extract `CsvPipelineService` with these interfaces”), add a numbered ADR under `docs/adr/` and link it from the relevant item below.

## Background

Code review of `apps/stream-api` focused on **coupling**, **layering**, and **SOLID**, covering `server.ts`, route plugins, storage, Postgres COPY, notifications (Redis + BullMQ), transforms, monitoring, and tests.

## Improvement items

### 1. Fat HTTP handler in `routes/process.ts` (SRP / testability)

- **Issue:** `processRoutes` embeds the full orchestration: status transitions, S3 download, stream construction, `pipeline()`, DB client release, S3 delete, status stats, webhook enqueue, and duplicated error-path logic (~130 lines in one handler).
- **Direction:** Extract a use-case service (e.g. `ProcessUploadUseCase` / `CsvIngestionPipeline`) that accepts ports for storage, status, DB copy stream, and webhook queue. Route handler: parse params → call use case → map result to HTTP.
- **Acceptance:** Route file stays thin; success/failure flows tested primarily against the service with injectable doubles.

### 2. Fastify `decorate` as implicit service locator (coupling)

- **Issue:** `storageService`, `statusService`, `webhookQueue`, and `databaseService` hang off `FastifyInstance`; route modules depend on augmented types and global app shape. `WebhookWorker` is constructed in `server.ts` only for side effects (never decorated), which is easy to miss when reading routes.
- **Direction:** Prefer explicit constructor injection into route factories, e.g. `registerProcessRoutes(app, deps)`, or a small composition module that returns a `deps` object. Keep Fastify decoration optional and localized.
- **Acceptance:** Dependencies visible in `register` calls or import graph without relying on undeclared globals.

### 3. Duplicate object-key policy

- **Issue:** `upload.ts` builds `uploads/${uploadId}.csv`; `process.ts` rebuilds the same string from `uploadId` only. Drift risk if the layout changes.
- **Direction:** Single helper or value object, e.g. `objectKeyForUpload(uploadId)`, shared by upload and process (and tests).
- **Acceptance:** One definition of key shape.

### 4. Postgres COPY SQL vs shared schema package (DRY / coupling)

- **Issue:** `DatabaseService.createCopyStream()` hardcodes table and columns (`webhook_events`, `provider`, `event_id`, …). The app depends on `@distributed-systems-lab/database` in `package.json` but the COPY statement is not derived from that package — schema drift vs ingestion-api/Drizzle is possible.
- **Direction:** Generate COPY column order from shared metadata, shared constant, or documented single source of truth; or import a string/fragment from the database package if appropriate.
- **Acceptance:** Column rename in shared schema forces a compile-time or test failure in stream-api.

### 5. Multiple Redis connections (same pattern as ingestion-api)

- **Issue:** `RedisClient` for `StatusService`, plus BullMQ `Queue` and `Worker` each use Redis `connection` config — multiple logical clients to the same server.
- **Direction:** Shared connection factory or document why BullMQ and ioredis cannot share; align with health/observability if you add Redis health later.
- **Acceptance:** Config in one module; connection count documented.

### 6. `WebhookWorker`: logging and HTTP client (DIP / observability)

- **Issue:** Uses `console.log` for lifecycle and delivery; uses global `fetch` with no injectable client — harder to test and inconsistent with Fastify’s logger.
- **Direction:** Inject `Logger` (pino child or interface) and optionally `fetch` / `WebhookHttpClient` for tests and timeouts/retries policy.
- **Acceptance:** Worker tests assert on mock HTTP client without patching global `fetch` if possible.

### 7. `ValidationTransform` and `MemoryMonitor`: unstructured logs

- **Issue:** `ValidationTransform._flush` logs via `console.log`; `MemoryMonitor` uses `console.log` / `console.warn` (including non-structured messages). Not correlated with request IDs or Fastify log level.
- **Direction:** Accept a logger in constructor or use a shared app logger from composition root; keep stream transforms test-friendly (optional no-op logger).
- **Acceptance:** Logs go through one structured pipeline in production paths.

### 8. Redis status JSON without runtime validation

- **Issue:** `StatusService.get` does `JSON.parse` and casts to `JobStatusRecord`. Corrupt or unexpected JSON yields weak guarantees.
- **Direction:** Validate with Zod (or similar) at the boundary if you adopt strict validation for stored blobs; at minimum document trust model (Redis only written by this app).
- **Acceptance:** Invalid payloads rejected or logged with clear errors.

### 9. Process route: optional guardrails

- **Issue:** Processing assumes `uploadId` matches a prior `create`; `update` throws if missing — acceptable but error surfaces late. No explicit check that `objectKey` matches stored `objectKey` on the record (if record existed with different key).
- **Direction:** Optional `get` before `update` to return 404 when unknown uploadId; optionally verify `objectKey` matches record for defense in depth.
- **Acceptance:** Clear 404 vs 500 semantics documented in SPEC if changed.

### 10. Dependency hygiene: `minio` npm package

- **Issue:** `minio` appears in `package.json` but there is no `import` from `minio` under `apps/stream-api` (S3 uses AWS SDK only). Likely dead weight (verify before removal).
- **Direction:** Remove if confirmed unused, or document why it must stay.
- **Acceptance:** No unused runtime dependency without justification.

## Suggested implementation order

1. **3** (object key helper) — low risk.  
2. **1** + **2** (extract use case + clarify deps) — largest maintainability win.  
3. **4** (COPY vs shared schema).  
4. **5**, **6**, **7** (connections, worker logging/HTTP, stream/monitor logs).  
5. **8**, **9** (validation, HTTP semantics).  
6. **10** (cleanup).

## References

- Code: `apps/stream-api/src/` (`server.ts`, `routes/`, `storage/`, `streams/postgres-writer.ts`, `notifications/`, `transforms/`, `monitoring/`)
- Spec: [SPEC-STREAM-API.md](./SPEC-STREAM-API.md)
- ADR index: [docs/adr/README.md](./adr/README.md)
