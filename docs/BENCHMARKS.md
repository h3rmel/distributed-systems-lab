# Performance Benchmarks

Consolidated results from acceptance tests across all three systems.

**Environment:** Docker Compose on Linux (WSL2), Node.js 24, PostgreSQL 16 Alpine, Redis 7 Alpine, MinIO.

---

## Ingestion API — K6 Load Test

| Metric           | Target  | Result                                 |
| ---------------- | ------- | -------------------------------------- |
| Virtual Users    | 500     | 499                                    |
| Total Requests   | —       | 184,849                                |
| Error Rate       | < 1%    | **0.00%**                              |
| P95 Latency      | < 100ms | **7.35ms**                             |
| Data Consistency | 100%    | **184,849 requests = 184,849 DB rows** |

**Test profile:** Ramp to 500 VUs over 10s, sustain for 1 minute, ramp down over 10s.

### Reproduce

```bash
cd apps/ingestion-api
pnpm test:load
```

Requires k6 v1.5+ installed and all infrastructure services running.

---

## Ingestion API — Unit Test Coverage

| Metric     | Threshold | Result                  |
| ---------- | --------- | ----------------------- |
| Statements | 80%       | **97.77%**              |
| Branches   | 70%       | **74.35%**              |
| Functions  | 80%       | **88.46%**              |
| Lines      | 80%       | **97.39%**              |
| Test Count | —         | **55 tests** (11 files) |

### Reproduce

```bash
cd apps/ingestion-api
pnpm test:cov
```

---

## Stream API — OOM Test (Memory Safety)

| Metric                 | Target              | Result                                     |
| ---------------------- | ------------------- | ------------------------------------------ |
| Input Size             | 5M rows (~1 GB CSV) | 5,000,000 rows                             |
| Container Memory Limit | 512 MB              | 512 MB                                     |
| Avg Memory Usage       | < 512 MB            | **57 MB**                                  |
| Peak Memory Usage      | < 512 MB            | **< 100 MB**                               |
| Throughput             | > 10,000 rows/sec   | **48,700 rows/sec**                        |
| Processing Time        | —                   | **102.7s**                                 |
| Data Consistency       | 100%                | **5,000,000 CSV rows = 5,000,000 DB rows** |

**Pipeline:** S3 download → CSV parse → Validation Transform → Formatter Transform → Postgres COPY.

### Reproduce

```bash
# Generate test CSV (5M rows)
cd apps/stream-api
pnpm generate:csv

# Run in memory-constrained container
docker compose up -d stream-api
curl -F "file=@test-data.csv" http://localhost:3002/upload
curl -X POST http://localhost:3002/upload/<uploadId>/process
```

---

## Stream API — Unit Test Coverage

| Metric     | Result                       |
| ---------- | ---------------------------- |
| Coverage   | **98.67%**                   |
| Test Count | **60 tests**                 |
| Framework  | Vitest + @vitest/coverage-v8 |

### Reproduce

```bash
cd apps/stream-api
pnpm test:cov
```

---

## Live Dashboard — Freeze Test

| Metric              | Target                        | Result     |
| ------------------- | ----------------------------- | ---------- |
| Backend Load        | 200 VUs (K6)                  | 200 VUs    |
| Chart Updates       | Continuous during load        | **Pass**   |
| Event Stream        | Flowing during load           | **Pass**   |
| UI Responsiveness   | Buttons clickable under load  | **Pass**   |
| Connection Recovery | Auto-reconnect on API restart | **Pass**   |
| Target FPS          | 60 FPS                        | Maintained |
| Target CPU          | < 70%                         | Met        |

**Method:** Run K6 load test against ingestion-api at 200 VUs with the dashboard open. Verified chart renders live RPS data, event stream scrolls, and UI remains interactive. Stopped and restarted ingestion-api to verify socket reconnection.

---

## Summary

All three systems meet their acceptance criteria:

- **Ingestion API:** 0% error rate at 500 VUs, 7.35ms P95 (target < 100ms)
- **Stream API:** 57 MB average memory processing 5M rows in 512 MB container, 48.7k rows/sec (target > 10k)
- **Live Dashboard:** No UI freeze under 200 VU load, automatic connection recovery
