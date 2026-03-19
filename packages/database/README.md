# @distributed-systems-lab/database

Shared Drizzle ORM configuration, PostgreSQL schema, and migration tooling.

## Schema

Table `webhook_events`:

| Column      | Type         | Constraints               |
| ----------- | ------------ | ------------------------- |
| `id`        | serial       | Primary key               |
| `provider`  | varchar(255) | NOT NULL                  |
| `eventId`   | varchar(255) | NOT NULL                  |
| `timestamp` | timestamptz  | NOT NULL                  |
| `data`      | jsonb        | NOT NULL                  |
| `createdAt` | timestamptz  | NOT NULL, default `now()` |

Indexes: `provider_idx`, `event_id_idx`, `timestamp_idx`.

## Exports

| Export             | Description                      |
| ------------------ | -------------------------------- |
| `db`               | Drizzle ORM instance with schema |
| `sql`              | Raw `postgres` client            |
| `webhookEvents`    | Table definition for queries     |
| `InferSelectModel` | Drizzle type helper (re-export)  |
| `InferInsertModel` | Drizzle type helper (re-export)  |

## Usage

```typescript
import { db, webhookEvents } from '@distributed-systems-lab/database';

const rows = await db.select().from(webhookEvents).limit(10);
```

## Scripts

| Script             | Description                                |
| ------------------ | ------------------------------------------ |
| `pnpm build`       | Compile TypeScript                         |
| `pnpm db:generate` | Generate SQL migration from schema changes |
| `pnpm db:migrate`  | Run pending migrations                     |
| `pnpm db:push`     | Push schema directly (dev only)            |
| `pnpm db:studio`   | Open Drizzle Studio (visual browser)       |

## Connection

Configured via environment variables: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`.

Pool: max 10 connections, 20s idle timeout, 10s connect timeout.
