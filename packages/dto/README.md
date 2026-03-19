# @distributed-systems-lab/dto

Shared TypeScript type definitions for the Distributed Systems Lab monorepo.

## Exports

| Export              | Type      | Description                                                           |
| ------------------- | --------- | --------------------------------------------------------------------- |
| `WebhookJobData<T>` | Interface | BullMQ job payload: provider, eventId, timestamp, data                |
| `WebhookEvent<T>`   | Interface | Database row shape: id, provider, eventId, timestamp, data, createdAt |
| `IngestResponseDto` | Interface | HTTP 202 response: accepted, jobId                                    |
| `JobCompletedEvent` | Interface | WebSocket event: jobId, eventId, provider, processingTime, timestamp  |
| `SocketEvents`      | Const     | Event name constants: `JOB_COMPLETED`, `CONNECTION`, `DISCONNECT`     |
| `SocketEventName`   | Type      | Union of `SocketEvents` values                                        |

## Usage

```typescript
import type { WebhookJobData, JobCompletedEvent } from '@distributed-systems-lab/dto';
```

## Build

```bash
pnpm build   # tsc → dist/
```
