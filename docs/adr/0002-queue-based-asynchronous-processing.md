# ADR-0002: Queue-Based Asynchronous Processing for Webhook Ingestion

## Status
Accepted

## Context
The Ingestion API receives webhook events that need to be processed and persisted to PostgreSQL. The system must:
- Return HTTP 202 Accepted immediately (< 100ms P95)
- Process webhooks asynchronously without blocking the API response
- Handle spikes in traffic (500+ concurrent users)
- Ensure no data loss even if the application restarts
- Support idempotency checks to prevent duplicate processing

**Alternatives considered:**
1. **Synchronous processing:** Process immediately in request handler (too slow, blocks API)
2. **In-memory queue:** Process in background threads (data loss on restart)
3. **Database queue:** Use database table as queue (slower, more complex)
4. **Message broker (BullMQ + Redis):** Persistent, fast, supports retries and idempotency

## Decision
We will use **BullMQ with Redis** as the queue system for asynchronous webhook processing.

**Architecture:**
- API layer receives webhook, validates DTO, enqueues job to BullMQ, returns 202
- Worker processor consumes jobs from queue, checks idempotency, persists to database
- Redis provides persistence (AOF enabled) to survive application restarts

## Consequences

### Positive
- **Performance:** API responds immediately, processing happens asynchronously
- **Reliability:** Jobs persist in Redis, survive application crashes
- **Scalability:** Can scale workers independently from API servers
- **Idempotency:** Built-in support for deduplication via Redis keys
- **Observability:** BullMQ provides job status, retry counts, failure tracking

### Negative
- **Infrastructure:** Requires Redis service (additional dependency)
- **Complexity:** More moving parts (API, queue, workers)
- **Latency:** End-to-end latency increases (but API response stays fast)
- **Cost:** Additional infrastructure cost for Redis

### Implementation Notes
- Use `@nestjs/bullmq` for NestJS integration
- Configure Redis with AOF persistence (`redis-server --appendonly yes`)
- Implement idempotency service using Redis SET with TTL (24h)
- Use `@Processor` decorator for worker classes
- Configure job options: retries, backoff, removeOnComplete

## References
- [SPEC-INGESTION-API.md](../SPEC-INGESTION-API.md)
- [BullMQ Documentation](https://docs.bullmq.io/)
