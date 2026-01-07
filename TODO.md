# Distributed Systems Lab - Implementation Roadmap

## Phase 0: Foundation (Infrastructure & Shared Packages)

### 0.1 Monorepo Initialization ✅
- [x] Create root `package.json` with pnpm workspaces configuration
  - [x] Kept CommonJS (default for NestJS compatibility)
  - [x] Created `pnpm-workspace.yaml` instead of package.json workspaces field
  - [x] Add scripts: `dev`, `build`, `lint`, `format`
- [x] Create directory structure:
  - [x] `mkdir -p apps/ingestion-api apps/live-dashboard apps/stream-engine`
  - [x] `mkdir -p packages/dto packages/database packages/eslint-config`
- [x] Create root `tsconfig.json` (base config for all projects)
  - [x] Enable strict mode
  - [x] Set target to ES2022
  - [x] Configure paths for workspace packages
- [x] Setup Prettier configuration (`.prettierrc`)
  - [x] Semi: true, single quotes: true, trailing comma: all
  - [x] Print width: 100, tab width: 2
- [x] Create `.prettierignore`
- [x] Install root-level dev dependencies:
  - [x] `pnpm add -D -w typescript prettier eslint` (v5.9.3, v3.7.4, v9.39.2)

### 0.2 Docker Compose Infrastructure ✅
- [x] Create `docker-compose.yaml` with 2 services:
  - [x] **PostgreSQL 16 Alpine:**
    - [x] Image: `postgres:16-alpine`
    - [x] Ports: `5432:5432`
    - [x] Environment: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
    - [x] Volumes: `./.docker/postgres-data:/var/lib/postgresql/data`
    - [x] Health check: `pg_isready -U ${POSTGRES_USER}`
  - [x] **Redis 7 Alpine:**
    - [x] Image: `redis:7-alpine`
    - [x] Ports: `6379:6379`
    - [x] Command: `redis-server --appendonly yes`
    - [x] Volumes: `./.docker/redis-data:/data`
    - [x] Health check: `redis-cli ping`
  - [x] **Network:** Create shared network `distributed-lab-network`
- [x] Create `.env.example` template with corrected ports:
  - [x] Dashboard: 3000
  - [x] Ingestion API: 3001
  - [x] Stream Engine: 3002
- [x] Copy `.env.example` to `.env` and fill in values
- [x] Test infrastructure:
  - [x] `docker compose up -d postgres redis`
  - [x] Verify both services are healthy: `docker compose ps` (Both healthy ✅)
  - [x] Test PostgreSQL connection: `docker compose exec postgres psql -U dev_user -d distributed_lab -c '\l'` (Connected ✅)
  - [x] Test Redis connection: `docker compose exec redis redis-cli ping` (PONG ✅)
- [x] Add Docker management scripts to root `package.json`:
  - [x] `docker:up` - Start all services in detached mode
  - [x] `docker:down` - Stop and remove all containers
  - [x] `docker:logs` - View logs from all services (follow mode)
  - [x] `docker:ps` - Show status of all services
  - [x] `docker:restart` - Restart all services
  - [x] `docker:clean` - Full cleanup (remove volumes and orphan containers)
  - [x] `docker:db` - Quick access to PostgreSQL CLI
  - [x] `docker:redis` - Quick access to Redis CLI

### 0.3 Shared Package: @distributed-systems-lab/dto ✅
- [x] Initialize package:
  - [x] `cd packages/dto && pnpm init`
  - [x] Set `"name": "@distributed-systems-lab/dto"` (scoped package name)
  - [x] Set `"main": "./dist/index.js"` and `"types": "./dist/index.d.ts"`
  - [x] Set `"private": true`
- [x] Create `tsconfig.json` extending root config
- [x] Create `src/` directory
- [x] Create `src/webhook.ts`:
  - [x] Export `WebhookJobData<T>` interface with generics for type safety
  - [x] Export `WebhookEvent<T>` interface (database entity shape with generics)
  - [x] Export `IngestResponseDto` interface (API response)
- [x] Create `src/socket.ts`:
  - [x] Export `JobCompletedEvent` interface (WebSocket event payload)
  - [x] Export `SocketEvents` constants for type-safe event names
  - [x] Export `SocketEventName` type
- [x] Create `src/index.ts` (barrel export for clean imports)
- [x] Add build script: `"build": "tsc"`
- [x] Build package: `pnpm build` (Successfully compiled ✅)

### 0.4 Shared Package: @repo/database
- [ ] Initialize package:
  - [ ] `cd packages/database && pnpm init`
  - [ ] Set `"name": "@repo/database"`
- [ ] Install dependencies:
  - [ ] `pnpm add drizzle-orm pg`
  - [ ] `pnpm add -D drizzle-kit @types/pg`
- [ ] Create `tsconfig.json` extending root config
- [ ] Create `src/schema.ts`:
  - [ ] Define `webhooksTable` using Drizzle ORM
  - [ ] Columns: id (serial PK), provider (varchar 50), eventId (varchar 100 unique), timestamp, data (jsonb), createdAt
- [ ] Create `src/connection.ts`:
  - [ ] Export `createDatabaseConnection()` factory function
  - [ ] Accept config: host, port, user, password, database
  - [ ] Return Drizzle instance with PostgreSQL pool
- [ ] Create `src/index.ts` (export schema and connection)
- [ ] Create `drizzle.config.ts` for migrations
- [ ] Generate initial migration: `pnpm drizzle-kit generate:pg`
- [ ] Apply migration:
  - [ ] Create migration script in package.json
  - [ ] Run migration against Docker PostgreSQL
  - [ ] Verify table exists: `docker compose exec postgres psql -U dev_user -d distributed_lab -c '\dt'`

### 0.5 Shared Package: @repo/eslint-config (Optional - Can defer)
- [ ] Initialize package: `cd packages/eslint-config && pnpm init`
- [ ] Create `nestjs.js` - ESLint config for NestJS
- [ ] Create `next.js` - ESLint config for Next.js  
- [ ] Create `node.js` - ESLint config for Node.js projects

---

## Phase 1: Ingestion API (NestJS + Fastify + BullMQ)

### 1.1 Project Setup
- [ ] Initialize NestJS project:
  - [ ] `cd apps/ingestion-api`
  - [ ] `npx @nestjs/cli new . --skip-git --package-manager pnpm`
- [ ] **CRITICAL:** Replace ExpressAdapter with FastifyAdapter
  - [ ] Install: `pnpm add @nestjs/platform-fastify`
  - [ ] Update `src/main.ts`:
    - [ ] Import `FastifyAdapter` and `NestFastifyApplication`
    - [ ] Use `NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter())`
    - [ ] Change `listen(3000, '0.0.0.0')` for Docker compatibility
- [ ] Install core dependencies:
  - [ ] `pnpm add @nestjs/config @nestjs/bullmq bullmq`
  - [ ] `pnpm add nestjs-pino pino-http pino-pretty`
  - [ ] `pnpm add class-validator class-transformer`
  - [ ] `pnpm add ioredis` (Redis client)
  - [ ] `pnpm add @repo/dto @repo/database` (workspace packages)
- [ ] Setup environment configuration:
  - [ ] Create `.env` (copy from root if needed)
  - [ ] Import `ConfigModule.forRoot({ isGlobal: true })` in AppModule

### 1.2 Logging Setup (nestjs-pino)
- [ ] Import `LoggerModule.forRoot()` in AppModule
- [ ] Configure pino options:
  - [ ] Set log level from environment
  - [ ] Use `pino-pretty` transport in development
  - [ ] JSON logs in production
- [ ] Test: Start app with `pnpm start:dev`, verify Fastify logs (NOT Express)

### 1.3 Database Module
- [ ] Create `src/database/database.module.ts`
- [ ] Create provider:
  - [ ] Token: `'DATABASE_CONNECTION'`
  - [ ] Factory: Use `createDatabaseConnection` from `@repo/database`
  - [ ] Inject: `ConfigService` for DB credentials
- [ ] Export `'DATABASE_CONNECTION'` provider
- [ ] Import `DatabaseModule` as global in AppModule
- [ ] Test: Inject connection in AppService, log successful connection

### 1.4 BullMQ Queue Configuration
- [ ] Import `BullModule.forRootAsync()` in AppModule:
  - [ ] Inject `ConfigService`
  - [ ] Configure Redis connection (host, port from env)
- [ ] Create `src/webhook/webhook.module.ts`
- [ ] Register queue: `BullModule.registerQueue({ name: 'webhooks' })`

### 1.5 Webhook Module (API Layer)
- [ ] Create `src/webhook/dto/create-webhook.dto.ts`:
  - [ ] Add decorators: `@IsString()`, `@IsNotEmpty()`, `@IsISO8601()`, `@IsObject()`
  - [ ] Properties: provider, eventId, timestamp, data
- [ ] Create `src/webhook/webhook.controller.ts`:
  - [ ] Inject `@InjectQueue('webhooks') private webhookQueue: Queue`
  - [ ] Inject `PinoLogger`
  - [ ] Create `@Post(':provider')` endpoint
  - [ ] Validate DTO with `@Body() dto: CreateWebhookDto`
  - [ ] Add job to queue: `await this.webhookQueue.add('ingest', { ...dto, provider })`
  - [ ] Return `{ accepted: true, jobId: job.id }` with HTTP 202
- [ ] Enable global ValidationPipe in `main.ts`:
  - [ ] `app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))`
- [ ] Test endpoint:
  - [ ] `curl -X POST http://localhost:3000/webhooks/stripe -H "Content-Type: application/json" -d '{"eventId":"evt_test","timestamp":"2024-01-01T00:00:00Z","data":{}}'`
  - [ ] Verify 202 response with jobId
  - [ ] Check Redis: `docker compose exec redis redis-cli KEYS '*'` (should see BullMQ keys)

### 1.6 Worker Module (Processor Layer)
- [ ] Create `src/worker/worker.module.ts`
- [ ] Create Redis client module:
  - [ ] Create `src/redis/redis.module.ts`
  - [ ] Provider: `'REDIS_CLIENT'` using `ioredis`
  - [ ] Export provider
- [ ] Create `src/worker/webhook.processor.ts`:
  - [ ] Decorate with `@Processor('webhooks')`
  - [ ] Inject `'DATABASE_CONNECTION'` and `'REDIS_CLIENT'`
  - [ ] Inject `PinoLogger`
  - [ ] Create `@Process('ingest')` method:
    - [ ] Extract `eventId` from `job.data`
    - [ ] Check idempotency: `await redis.get(`processed:${eventId}`)`
    - [ ] If exists, log warning and return (skip duplicate)
    - [ ] Insert to database: `await db.insert(webhooksTable).values(job.data)`
    - [ ] Set idempotency key: `await redis.setex(`processed:${eventId}`, 86400, '1')` (24h TTL)
    - [ ] Log success: `{ eventId, provider, jobId: job.id }`
  - [ ] Wrap in try/catch, log errors, rethrow (BullMQ handles retries)
- [ ] Import WorkerModule in AppModule
- [ ] Test processor:
  - [ ] Send webhook via curl
  - [ ] Check logs for "Webhook processed"
  - [ ] Verify database: `docker compose exec postgres psql -U dev_user -d distributed_lab -c 'SELECT * FROM webhooks;'`
  - [ ] Send same webhook again (duplicate), verify it's skipped

### 1.7 Health Module (Terminus)
- [ ] Install: `pnpm add @nestjs/terminus`
- [ ] Create `src/health/health.module.ts`
- [ ] Create `src/health/health.controller.ts`:
  - [ ] Inject `HealthCheckService`
  - [ ] Create health indicators for database and Redis
  - [ ] `@Get()` endpoint with `@HealthCheck()` decorator
  - [ ] Return `this.health.check([...checks])`
- [ ] Import HealthModule in AppModule
- [ ] Test: `curl http://localhost:3000/health` (should return status: ok)

### 1.8 Security & Rate Limiting
- [ ] Install Fastify plugins:
  - [ ] `pnpm add @fastify/helmet @fastify/cors @fastify/rate-limit`
- [ ] Register in `main.ts`:
  - [ ] Helmet: `await app.register(helmet)`
  - [ ] CORS: `await app.register(cors, { origin: process.env.ALLOWED_ORIGINS })`
  - [ ] Rate limit: `await app.register(rateLimit, { max: 100, timeWindow: '1 minute' })`
- [ ] Test rate limiting: Send 101 requests rapidly, verify 429 response

### 1.9 WebSocket Gateway (For Dashboard)
- [ ] Install: `pnpm add @nestjs/websockets @nestjs/platform-socket.io`
- [ ] Create `src/metrics/metrics.gateway.ts`:
  - [ ] Decorate with `@WebSocketGateway({ cors: true })`
  - [ ] Inject `@WebSocketServer() server: Server`
- [ ] Update WebhookProcessor to emit events:
  - [ ] Inject MetricsGateway
  - [ ] After successful processing, emit: `gateway.server.emit('job-completed', { jobId, eventId, provider, processingTime })`
- [ ] Test: Use Postman or socket.io client to connect to `ws://localhost:3000` and listen for `job-completed` events

### 1.10 Load Testing (K6)
- [ ] Create `tests/load-test.js` (copy from SPEC-INGESTION-API.md Appendix)
- [ ] Install k6: Follow instructions at https://k6.io/docs/getting-started/installation/
- [ ] Run test: `k6 run tests/load-test.js`
- [ ] Verify acceptance criteria:
  - [ ] Throughput: 500 VUs handled successfully
  - [ ] Error rate: < 1% (ideally 0%)
  - [ ] P95 latency: < 100ms
  - [ ] Data consistency: K6 requests count == PostgreSQL row count
- [ ] **DEFINITION OF DONE:** All acceptance criteria passed ✅

### 1.11 Dockerfile (Optional - for containerization)
- [ ] Create multi-stage Dockerfile:
  - [ ] Stage 1: Base (Node 20 Alpine)
  - [ ] Stage 2: Dependencies (pnpm install)
  - [ ] Stage 3: Builder (pnpm build)
  - [ ] Stage 4: Runner (production dependencies only)
- [ ] Add ingestion-api service to `docker-compose.yml`
- [ ] Test: `docker compose up ingestion-api`

---

## Phase 2: Live Dashboard (Next.js 14 + Zustand + Socket.io)

### 2.1 Project Setup
- [ ] Initialize Next.js 14:
  - [ ] `cd apps/live-dashboard`
  - [ ] `npx create-next-app@latest . --typescript --tailwind --app --no-src-dir`
- [ ] Install dependencies:
  - [ ] `pnpm add zustand socket.io-client recharts`
  - [ ] `pnpm add @tanstack/react-virtual`
  - [ ] `pnpm add @repo/dto` (workspace package)
- [ ] Configure `tsconfig.json`:
  - [ ] Add path alias: `"@/*": ["./*"]`
  - [ ] Add workspace package path: `"@repo/dto": ["../../packages/dto/src"]`
- [ ] Create `.env.local`:
  - [ ] `NEXT_PUBLIC_API_URL=http://localhost:3000`

### 2.2 Zustand Store (High-Frequency State Management)
- [ ] Create `store/metrics.ts`:
  - [ ] Import `JobCompletedEvent` from `@repo/dto`
  - [ ] Define `MetricsStore` interface:
    - [ ] `events: JobCompletedEvent[]` (last 100 events)
    - [ ] `addEvent: (event: JobCompletedEvent) => void`
    - [ ] `getRPS: () => number` (calculate from recent events)
  - [ ] Create store with `create<MetricsStore>()`
  - [ ] Implement `addEvent`: append to array, slice to keep last 100
  - [ ] Implement `getRPS`: count events in last 1 second
- [ ] **CRITICAL:** Do NOT use useState for socket events (causes re-render storm)

### 2.3 Socket.io Client (Real-Time Connection)
- [ ] Create `lib/socket.ts`:
  - [ ] Import `io` from `socket.io-client`
  - [ ] Create singleton socket connection to `process.env.NEXT_PUBLIC_API_URL`
  - [ ] Configure reconnection: `reconnection: true`, `reconnectionDelay: 1000`
  - [ ] Listen for `'job-completed'` events
  - [ ] On event, call: `useMetricsStore.getState().addEvent(event)`
  - [ ] Export socket instance
- [ ] Create `lib/socket-manager.ts` (connection lifecycle):
  - [ ] Create class with `connect()`, `disconnect()` methods
  - [ ] Handle connection state (connecting, connected, disconnected)
  - [ ] Export singleton instance

### 2.4 Dashboard Layout
- [ ] Create `app/page.tsx` (main dashboard page):
  - [ ] Mark as `'use client'`
  - [ ] Import socket manager
  - [ ] Call `socketManager.connect()` in useEffect
  - [ ] Cleanup: `socketManager.disconnect()` on unmount
- [ ] Create `components/ConnectionStatus.tsx`:
  - [ ] Show socket connection state (Connected, Disconnected, Reconnecting)
  - [ ] Use green/red/yellow indicator
- [ ] Create basic layout with TailwindCSS:
  - [ ] Header with title and connection status
  - [ ] Grid layout: Chart on left, Logs on right

### 2.5 Throughput Chart (Throttled Updates)
- [ ] Create `components/ThroughputChart.tsx`:
  - [ ] Mark as `'use client'`
  - [ ] Import `LineChart` from `recharts`
  - [ ] Use local state: `[chartData, setChartData] = useState([])`
  - [ ] **CRITICAL:** Throttle updates with useEffect:
    - [ ] Set interval: `setInterval(() => { ... }, 1000 / 30)` (30 FPS)
    - [ ] Inside interval: get RPS from store, update chartData
    - [ ] Keep last 60 data points (60 seconds of history)
  - [ ] Render LineChart with X axis (timestamp) and Y axis (RPS)
- [ ] Style with TailwindCSS:
  - [ ] Card background, padding, rounded corners
  - [ ] Responsive sizing
- [ ] **DO NOT:** Subscribe directly to store (prevents re-render storm)

### 2.6 Live Log Stream (Virtualized List)
- [ ] Create `components/LiveLogStream.tsx`:
  - [ ] Mark as `'use client'`
  - [ ] Import `useVirtualizer` from `@tanstack/react-virtual`
  - [ ] Get events from store: `const events = useMetricsStore(state => state.events)`
  - [ ] Create parent ref: `const parentRef = useRef<HTMLDivElement>(null)`
  - [ ] Setup virtualizer:
    - [ ] `count: events.length`
    - [ ] `getScrollElement: () => parentRef.current`
    - [ ] `estimateSize: () => 50` (row height in pixels)
  - [ ] Render virtualized list:
    - [ ] Parent div with `ref={parentRef}`, fixed height (e.g., 600px), overflow auto
    - [ ] Inner div with total height: `virtualizer.getTotalSize()`
    - [ ] Map over `virtualizer.getVirtualItems()`, render only visible rows
  - [ ] Display: eventId, provider, timestamp, processing time
- [ ] **CRITICAL:** Do NOT use standard `<ul>` (will freeze browser under load)

### 2.7 Metrics Cards
- [ ] Create `components/MetricsCards.tsx`:
  - [ ] Display real-time metrics:
    - [ ] Current RPS (requests per second)
    - [ ] Total events processed (events.length or fetch from API)
    - [ ] Average processing time
    - [ ] Connection status
  - [ ] Use TailwindCSS cards with icons
  - [ ] Update at same throttle rate as chart (30 FPS)

### 2.8 Performance Testing (Freeze Test)
- [ ] Start Ingestion API
- [ ] Run K6 load test: `k6 run tests/load-test.js` (500 VUs)
- [ ] Open Dashboard in Chrome
- [ ] Open Chrome DevTools → Performance Monitor
- [ ] Verify acceptance criteria:
  - [ ] CPU usage < 70%
  - [ ] UI remains responsive (click buttons, scroll logs)
  - [ ] Chart updates smoothly (no stuttering)
  - [ ] No browser freezing or crashing
- [ ] Test reconnection:
  - [ ] Stop Ingestion API
  - [ ] Verify chart goes to zero
  - [ ] Restart Ingestion API
  - [ ] Verify chart recovers immediately
- [ ] **DEFINITION OF DONE:** All acceptance criteria passed ✅

### 2.9 Dockerfile (Optional)
- [ ] Create multi-stage Dockerfile for Next.js
- [ ] Add live-dashboard service to `docker-compose.yml`
- [ ] Build and test: `docker compose up live-dashboard`

---

## Phase 3: Stream Engine (Node.js Streams + Fastify)

### 3.1 Project Setup
- [ ] Initialize project:
  - [ ] `cd apps/stream-engine`
  - [ ] `pnpm init`
  - [ ] Set `"type": "module"` for ESM support
- [ ] Install dependencies:
  - [ ] `pnpm add fastify @fastify/multipart`
  - [ ] `pnpm add fast-csv` (streaming CSV parser)
  - [ ] `pnpm add pg pg-copy-streams` (Postgres COPY protocol)
  - [ ] `pnpm add @repo/database` (workspace package)
  - [ ] `pnpm add -D typescript @types/node @types/pg`
- [ ] Create `tsconfig.json`:
  - [ ] Extend root config
  - [ ] Set `"module": "ESNext"`, `"target": "ES2022"`
  - [ ] Set `"outDir": "./dist"`

### 3.2 Fastify Server Setup
- [ ] Create `src/server.ts`:
  - [ ] Import Fastify: `import Fastify from 'fastify'`
  - [ ] Create app: `const app = Fastify({ logger: true })`
  - [ ] Register multipart plugin:
    - [ ] `await app.register(multipart, { limits: { fileSize: 5 * 1024 * 1024 * 1024 } })` (5GB)
  - [ ] Start server: `await app.listen({ port: 3001, host: '0.0.0.0' })`
- [ ] Add start script to `package.json`: `"start": "node dist/server.js"`
- [ ] Test: `pnpm build && pnpm start` (server should start on port 3001)

### 3.3 Streaming Pipeline (CSV Upload Endpoint)
- [ ] Create `src/routes/upload.ts`:
  - [ ] Import `pipeline` from `stream/promises`
  - [ ] Import `parse` from `fast-csv`
  - [ ] Create POST `/upload` route:
    - [ ] Get file: `const data = await request.file()`
    - [ ] Validate file exists
    - [ ] Setup pipeline: `data.file` → `csvParser` → `validationTransform` → `postgresWriteStream`
  - [ ] Use `await pipeline(...)` for automatic error handling and cleanup
- [ ] **CRITICAL:** Do NOT use `fs.readFileSync` or load entire file into memory
- [ ] **CRITICAL:** Use `stream.pipeline()` for all operations

### 3.4 Validation Transform Stream
- [ ] Create `src/transforms/validation.ts`:
  - [ ] Import `Transform` from `stream`
  - [ ] Create class extending `Transform`:
    - [ ] Constructor: `super({ objectMode: true, highWaterMark: 100 })`
    - [ ] Implement `_transform(row, encoding, callback)`:
      - [ ] Validate row has required fields (provider, eventId, timestamp, data)
      - [ ] Validate eventId is unique (check against Set or database)
      - [ ] If valid: `this.push(row); callback()`
      - [ ] If invalid: log warning, `callback()` (skip row, continue processing)
  - [ ] Export class

### 3.5 CSV Formatter Transform (For Postgres COPY)
- [ ] Create `src/transforms/formatter.ts`:
  - [ ] Create Transform stream that converts objects to CSV format
  - [ ] Implement `_transform(obj, encoding, callback)`:
    - [ ] Convert object to CSV line: `provider,eventId,timestamp,data\n`
    - [ ] Escape JSON data properly for CSV
    - [ ] `this.push(csvLine); callback()`
  - [ ] Export class

### 3.6 Postgres COPY Stream
- [ ] Create `src/streams/postgres-writer.ts`:
  - [ ] Import `copyFrom` from `pg-copy-streams`
  - [ ] Create function `createPostgresWriteStream()`:
    - [ ] Get PostgreSQL client from pool
    - [ ] Create COPY stream:
      - [ ] `const copyStream = client.query(copyFrom.from('COPY webhooks (provider, event_id, timestamp, data) FROM STDIN CSV'))`
    - [ ] Return copyStream
  - [ ] Handle cleanup: release client after stream ends
- [ ] **CRITICAL:** Use COPY protocol (NOT individual INSERTs - 100x slower)

### 3.7 Complete Pipeline Integration
- [ ] Update `src/routes/upload.ts`:
  - [ ] Import all transforms and streams
  - [ ] Build complete pipeline:
    ```typescript
    await pipeline(
      data.file,
      parse({ headers: true }),
      new ValidationTransform(),
      new FormatterTransform(),
      createPostgresWriteStream(),
    );
    ```
  - [ ] Wrap in try/catch:
    - [ ] On success: return `{ success: true, message: 'File processed' }`
    - [ ] On error: log error, return `{ success: false, error: error.message }`
- [ ] Register route in server: `app.register(uploadRoutes)`

### 3.8 Memory Monitoring
- [ ] Create `src/monitoring/memory.ts`:
  - [ ] Import `v8` from `node:v8`
  - [ ] Create function `startMemoryMonitoring()`:
    - [ ] Set interval (every 5 seconds)
    - [ ] Get heap stats: `v8.getHeapStatistics()`
    - [ ] Calculate used MB: `used_heap_size / 1024 / 1024`
    - [ ] Log memory usage
    - [ ] If > 400MB, log warning
  - [ ] Export function
- [ ] Call `startMemoryMonitoring()` in `src/server.ts` after server starts

### 3.9 Docker Configuration (512MB Memory Limit)
- [ ] Add stream-engine service to `docker-compose.yml`:
  - [ ] Build from `./apps/stream-engine`
  - [ ] Port: `3001:3001`
  - [ ] Depends on: postgres
  - [ ] Environment: Database connection from `.env`
  - [ ] **CRITICAL:** Add resource limits:
    ```yaml
    deploy:
      resources:
        limits:
          memory: 512M
    ```
  - [ ] Environment: `NODE_OPTIONS=--max-old-space-size=450` (leave headroom)
- [ ] Create `Dockerfile` in `apps/stream-engine/`
- [ ] Test: `docker compose up stream-engine`

### 3.10 Load Testing (OOM Test)
- [ ] Generate test CSV file:
  - [ ] Create script to generate 5 million rows (~1GB)
  - [ ] Columns: provider, eventId, timestamp, data (JSON)
  - [ ] Use unique eventIds (e.g., `evt_${i}`)
- [ ] Upload via curl:
  - [ ] `curl -F "file=@large.csv" http://localhost:3001/upload`
- [ ] Monitor during upload:
  - [ ] Terminal 1: `docker stats stream-engine` (watch memory usage)
  - [ ] Terminal 2: Watch application logs (memory monitoring output)
- [ ] Verify acceptance criteria:
  - [ ] Memory stays flat (100-200MB oscillation, NOT linear growth)
  - [ ] Completion: HTTP 200 returned only after all rows processed
  - [ ] Database consistency: `SELECT COUNT(*) FROM webhooks` == CSV row count
- [ ] **DEFINITION OF DONE:** All acceptance criteria passed ✅

### 3.11 Error Handling & Graceful Shutdown
- [ ] Add error handling at each pipeline stage
- [ ] Implement graceful shutdown:
  - [ ] Listen for SIGTERM/SIGINT
  - [ ] Close Fastify server gracefully
  - [ ] Close database connections
  - [ ] Close any open file streams

---

## Phase 4: Integration & Documentation

### 4.1 End-to-End Testing
- [ ] Test complete system flow:
  - [ ] Start all services: `docker compose up -d`
  - [ ] Send webhooks via Ingestion API
  - [ ] Verify Dashboard shows real-time updates
  - [ ] Upload CSV via Stream Engine
  - [ ] Verify all data in PostgreSQL
- [ ] Test failure scenarios:
  - [ ] Stop PostgreSQL, verify health checks fail
  - [ ] Stop Redis, verify BullMQ handles gracefully
  - [ ] Kill Ingestion API, verify Dashboard reconnects

### 4.2 Documentation
- [ ] Create root `README.md`:
  - [ ] Project overview (3 systems)
  - [ ] Architecture diagram
  - [ ] Prerequisites (Node 20+, Docker, pnpm)
  - [ ] Quick start guide
  - [ ] Environment variables reference
- [ ] Create per-project READMEs:
  - [ ] `apps/ingestion-api/README.md` - API endpoints, modules, testing
  - [ ] `apps/live-dashboard/README.md` - Components, performance patterns
  - [ ] `apps/stream-engine/README.md` - Streaming architecture, memory constraints
- [ ] Document shared packages:
  - [ ] `packages/dto/README.md` - Type definitions
  - [ ] `packages/database/README.md` - Schema, migrations

### 4.3 Scripts & Automation
- [ ] Add root-level scripts to `package.json`:
  - [ ] `"dev": "docker compose up -d && pnpm --parallel --filter './apps/*' dev"`
  - [ ] `"build": "pnpm --recursive --filter './apps/*' build"`
  - [ ] `"lint": "pnpm --recursive lint"`
  - [ ] `"test": "pnpm --recursive test"`
  - [ ] `"clean": "pnpm --recursive --parallel exec rm -rf dist node_modules"`
- [ ] Create `scripts/` directory:
  - [ ] `generate-csv.js` - Generate test CSV files for Stream Engine
  - [ ] `seed-database.js` - Seed database with test data
  - [ ] `reset-dev.sh` - Reset development environment (drop DB, clear Redis)

### 4.4 Performance Benchmarking
- [ ] Run all acceptance tests:
  - [ ] Ingestion API: K6 load test (500 VUs)
  - [ ] Dashboard: Freeze test (CPU < 70%)
  - [ ] Stream Engine: OOM test (1GB file in 512MB container)
- [ ] Document results in `BENCHMARKS.md`
- [ ] Record metrics: P95 latency, throughput, memory usage

### 4.5 Final Review
- [ ] Code quality:
  - [ ] Run linter on all projects: `pnpm lint`
  - [ ] Run formatter: `pnpm format`
  - [ ] Check for `any` types in TypeScript
  - [ ] Verify JSDoc comments on public functions
- [ ] Security:
  - [ ] Run `pnpm audit` on all projects
  - [ ] Verify `.env` is in `.gitignore`
  - [ ] Verify secrets are not in git history
- [ ] Architecture review:
  - [ ] Verify SOLID principles applied
  - [ ] Verify controllers have no business logic
  - [ ] Verify streaming code uses `pipeline()` not `readFileSync`
  - [ ] Verify Dashboard throttles UI updates

---

## Deployment Checklist (Optional - Production)

### Docker Production Images
- [ ] Optimize Dockerfiles for production:
  - [ ] Multi-stage builds
  - [ ] Minimal base images (alpine)
  - [ ] Non-root user
- [ ] Build production images: `docker compose -f docker-compose.prod.yml build`
- [ ] Test production images locally

### Kubernetes (Optional)
- [ ] Create Kubernetes manifests:
  - [ ] Deployments for each service
  - [ ] Services and Ingress
  - [ ] ConfigMaps for configuration
  - [ ] Secrets for credentials
  - [ ] PersistentVolumeClaims for PostgreSQL/Redis
- [ ] Apply manifests: `kubectl apply -f k8s/`
- [ ] Verify health checks work

### CI/CD (Optional)
- [ ] Setup GitHub Actions / GitLab CI:
  - [ ] Lint and test on PR
  - [ ] Build Docker images on merge
  - [ ] Deploy to staging
  - [ ] Run acceptance tests
  - [ ] Deploy to production (manual approval)

---

## Notes & Tips

### Development Workflow
- Use `pnpm --filter` to run commands in specific workspaces
- Example: `pnpm --filter @apps/ingestion-api dev`
- Example: `pnpm --filter @repo/database build`

### Debugging
- View Docker logs: `docker compose logs -f [service_name]`
- Access PostgreSQL: `docker compose exec postgres psql -U dev_user -d distributed_lab`
- Access Redis: `docker compose exec redis redis-cli`

### Common Issues
- **Port conflicts:** Ensure 3000, 3001, 5432, 6379 are available
- **Volume permissions:** May need `sudo chown` on `.docker/` folder
- **Workspace resolution:** If imports fail, run `pnpm install` at root

### Memory Bank Integration
- Use `/summarize` to refresh project context
- Use `/investigate [module]` for deep dives
- Use `/review [file]` for code quality checks
- Use `/commit` for semantic commits

---

**Last Updated:** 2026-01-07
**Status:** Ready for implementation 🚀
