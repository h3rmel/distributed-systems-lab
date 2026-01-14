# ADR-0001: Use FastifyAdapter over ExpressAdapter for Ingestion API

## Status
Accepted

## Context
The Ingestion API needs to handle high-throughput webhook ingestion (10k+ requests/second) with strict performance requirements:
- P95 latency < 100ms for HTTP 202 Accepted response
- Support 500 concurrent virtual users
- Error rate < 1%

NestJS supports two HTTP adapters by default:
- **ExpressAdapter** (default): Mature, widely used, but slower performance
- **FastifyAdapter**: Higher performance, lower overhead, built for speed

## Decision
We will use **FastifyAdapter** instead of ExpressAdapter for the Ingestion API.

**Rationale:**
- Fastify is designed for high-performance scenarios with lower overhead
- Benchmarks show 2-3x better throughput compared to Express
- Maintains NestJS architectural patterns (controllers, services, modules)
- Required for meeting P95 < 100ms latency target under load

## Consequences

### Positive
- **Performance:** Significantly better throughput and lower latency
- **Memory:** Lower memory footprint per request
- **Scalability:** Better handling of concurrent connections
- **Compatibility:** Still uses NestJS patterns, just different underlying HTTP server

### Negative
- **Ecosystem:** Some Express middleware may not work directly (need Fastify equivalents)
- **Learning Curve:** Team needs to understand Fastify-specific patterns
- **Documentation:** Less community examples compared to Express

### Implementation Notes
- Use `@nestjs/platform-fastify` package
- Register Fastify plugins (helmet, cors, rate-limit) using Fastify's plugin system
- Use `NestFastifyApplication` type for type safety
- All NestJS patterns (controllers, guards, interceptors) work identically

## References
- [SPEC-INGESTION-API.md](../SPEC-INGESTION-API.md)
- [NestJS Fastify Documentation](https://docs.nestjs.com/techniques/performance)
