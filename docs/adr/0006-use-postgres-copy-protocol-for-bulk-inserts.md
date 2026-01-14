# ADR-0006: Use Postgres COPY Protocol for Bulk Inserts in Stream API

## Status
Accepted

## Context
The Stream API needs to insert millions of rows (5M+) from CSV files into PostgreSQL:
- Must process > 10,000 rows/second
- Must maintain 512MB memory constraint
- Must handle backpressure when database is slow
- Cannot use individual INSERT statements (too slow)

**Alternatives considered:**
1. **Individual INSERTs:** Too slow (100x slower), doesn't meet throughput requirement
2. **Batch INSERTs:** Better but still slow, requires buffering (memory constraint)
3. **Postgres COPY Protocol:** Fastest option, streaming, handles backpressure

## Decision
We will use **Postgres COPY protocol** via `pg-copy-streams` for bulk inserts.

**Implementation:**
- Use `pg-copy-streams` library to create COPY stream
- Stream CSV data directly to PostgreSQL connection
- Use `stream.pipeline()` to handle backpressure automatically
- Format data as CSV compatible with COPY FROM STDIN

## Consequences

### Positive
- **Performance:** 100x faster than individual INSERTs
- **Memory:** Streaming operation, no buffering required
- **Backpressure:** Automatically pauses source stream when database is slow
- **Throughput:** Easily exceeds 10,000 rows/second requirement
- **Memory Constraint:** Maintains 512MB RAM limit

### Negative
- **Complexity:** Requires raw PostgreSQL client (not Drizzle ORM abstraction)
- **Error Handling:** Need to handle COPY-specific errors
- **Format:** Must format data as CSV (proper escaping required)
- **Connection:** Requires dedicated connection from pool (not shared)

### Implementation Notes
- Get dedicated connection from pool: `const client = await pool.connect()`
- Create COPY stream: `client.query(copyFrom.from('COPY webhook_events (...) FROM STDIN CSV'))`
- Use Transform stream to format objects → CSV
- Use `stream.pipeline()` for automatic cleanup and backpressure
- Release connection after stream completes
- Handle errors at pipeline level

## References
- [SPEC-STREAM-API.md](../SPEC-STREAM-API.md)
- [pg-copy-streams Documentation](https://github.com/brianc/node-pg-copy-streams)
