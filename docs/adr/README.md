# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records (ADRs) for the Distributed Systems Lab monorepo.

## What are ADRs?

ADRs document important architectural decisions made during the project. They capture:
- **Context:** Why the decision was needed
- **Decision:** What was decided
- **Consequences:** Positive and negative impacts

## ADR Format

Each ADR follows this structure:
- **Title:** Descriptive title with ADR number
- **Status:** Proposed / Accepted / Deprecated / Superseded
- **Context:** Background and problem statement
- **Decision:** The chosen solution
- **Consequences:** Positive and negative impacts
- **References:** Links to related specs or documentation

## Current ADRs

| ADR | Title | Status | Project |
|-----|-------|--------|---------|
| [0001](./0001-use-fastify-adapter-over-express.md) | Use FastifyAdapter over ExpressAdapter | Accepted | Ingestion API |
| [0002](./0002-queue-based-asynchronous-processing.md) | Queue-Based Asynchronous Processing | Accepted | Ingestion API |
| [0003](./0003-use-drizzle-orm-over-typeorm-prisma.md) | Use Drizzle ORM over TypeORM/Prisma | Accepted | All Projects |
| [0004](./0004-use-zustand-over-react-context-for-high-frequency-updates.md) | Use Zustand over React Context | Accepted | Dashboard |
| [0005](./0005-use-object-storage-for-stream-api-uploads.md) | Use Object Storage for Stream API | Accepted | Stream API |
| [0006](./0006-use-postgres-copy-protocol-for-bulk-inserts.md) | Use Postgres COPY Protocol | Accepted | Stream API |

## When to Create an ADR

Create an ADR when:
- Making a significant architectural choice
- Choosing between multiple viable alternatives
- The decision affects multiple projects or has long-term implications
- The decision needs to be documented for future reference

## References

- [SPEC-INGESTION-API.md](../SPEC-INGESTION-API.md)
- [SPEC-DASHBOARD.md](../SPEC-DASHBOARD.md)
- [SPEC-STREAM-API.md](../SPEC-STREAM-API.md)
