# ADR-0003: Use Drizzle ORM over TypeORM/Prisma

## Status

Accepted

## Context

We need a TypeScript ORM for PostgreSQL that:

- Provides type safety for database operations
- Supports connection pooling
- Works well with NestJS dependency injection
- Has minimal runtime overhead
- Supports migrations

**Alternatives considered:**

1. **TypeORM:** Mature, feature-rich, but heavy runtime overhead
2. **Prisma:** Excellent DX, but requires code generation, heavier runtime
3. **Drizzle ORM:** Lightweight, zero runtime overhead, type-safe, SQL-like API

## Decision

We will use **Drizzle ORM** for database operations across all projects.

**Rationale:**

- **Performance:** Zero runtime overhead (just SQL queries)
- **Type Safety:** Full TypeScript inference without code generation
- **Flexibility:** SQL-like API, easy to write complex queries
- **NestJS Integration:** Works well with Dynamic Modules pattern
- **Shared Package:** Can be used across all projects in monorepo

## Consequences

### Positive

- **Performance:** Minimal overhead, direct SQL execution
- **Type Safety:** Compile-time type checking without codegen step
- **Flexibility:** Can write raw SQL when needed
- **Bundle Size:** Smaller bundle size compared to Prisma/TypeORM
- **Learning Curve:** SQL-like API is intuitive for developers

### Negative

- **Maturity:** Less mature ecosystem than TypeORM/Prisma
- **Features:** Fewer built-in features (no built-in validation, relations are manual)
- **Documentation:** Less comprehensive documentation and examples
- **Migrations:** Migration tooling is simpler (but sufficient)

### Implementation Notes

- Use `postgres` driver (faster than `pg`)
- Configure connection pooling (max: 10 connections)
- Create shared `@distributed-systems-lab/database` package
- Use Drizzle Kit for migrations (`drizzle-kit generate`)
- Export schema types for use across projects

## References

- [SPEC-INGESTION-API.md](../SPEC-INGESTION-API.md)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
