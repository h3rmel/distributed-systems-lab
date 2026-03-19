# Live Dashboard

Real-time analytics dashboard visualizing webhook ingestion throughput. Built with Next.js 16 (App Router), Zustand 5, Socket.io, and Recharts. Renders 100+ events/sec without UI freeze.

## KPIs

| Metric                 | Target    | Achieved                              |
| ---------------------- | --------- | ------------------------------------- |
| Rendering FPS          | 60 FPS    | Maintained under 200 VU load          |
| Event-to-Pixel Latency | < 200ms   | Met                                   |
| CPU Under Load         | < 70%     | Met                                   |
| Socket Reconnection    | Automatic | Exponential backoff, infinite retries |

## Architecture

```
┌─────────────────────────────────────────────────┐
│  Browser                                         │
│                                                  │
│  ┌──────────────┐   Socket.io    ┌────────────┐ │
│  │ SocketManager │◄──────────────│ Ingestion   │ │
│  │ (singleton)   │  job-completed│ API :3001   │ │
│  └──────┬───────┘               └────────────┘ │
│         │ getState().addEvent()                  │
│         ▼                                        │
│  ┌──────────────┐                                │
│  │ Zustand Store │  events[], chartData[]         │
│  │ (metrics.ts)  │                                │
│  └──┬────┬───┬──┘                                │
│     │    │   │                                    │
│     ▼    ▼   ▼                                    │
│  ┌────┐┌────────────┐┌──────────────┐            │
│  │Chart││LiveLogStream││MetricsCards  │            │
│  │1/s  ││(TanStack V.) ││(500ms poll) │            │
│  └────┘└────────────┘└──────────────┘            │
└─────────────────────────────────────────────────┘
```

## Components

| Component          | File                               | Purpose                                            |
| ------------------ | ---------------------------------- | -------------------------------------------------- |
| `Home`             | `app/page.tsx`                     | Page shell — socket lifecycle, 1s chart timer      |
| `ConnectionStatus` | `components/connection-status.tsx` | Green/yellow/red dot + label                       |
| `ThroughputChart`  | `components/throughput-chart.tsx`  | Recharts LineChart (60 data points, 1s updates)    |
| `LiveLogStream`    | `components/live-log-stream.tsx`   | TanStack Virtual list (last 100 events, 64px rows) |
| `MetricsCards`     | `components/metrics-cards.tsx`     | RPS, total events, avg processing time, connection |

### Shadcn UI Components

| Component                                 | Path                            |
| ----------------------------------------- | ------------------------------- |
| Card, CardHeader, CardContent, CardFooter | `components/ui/card.tsx`        |
| ChartContainer, ChartTooltip              | `components/ui/chart.tsx`       |
| ScrollArea, ScrollBar                     | `components/ui/scroll-area.tsx` |

## State Management (Zustand)

```typescript
interface MetricsStore {
  events: JobCompletedEvent[]; // Last 100 events (newest first)
  chartData: { time: string; rps: number }[]; // Last 60 samples

  addEvent(event: JobCompletedEvent): void; // Prepend + slice(0, 100)
  computeRPS(): number; // Count events in last 1s
  pushChartPoint(): void; // Append { time, rps }
}
```

**Update strategy:**

- `addEvent` is called from the socket listener (outside React) — no re-render per event.
- `pushChartPoint` runs every 1s via `setInterval` in the page component.
- `MetricsCards` polls `getState()` every 500ms — avoids subscription re-renders.

## Socket.io Integration

| File                    | Purpose                                                                     |
| ----------------------- | --------------------------------------------------------------------------- |
| `lib/socket.ts`         | Socket factory + `job-completed` listener wired to store                    |
| `lib/socket-manager.ts` | Singleton with `connect()`, `disconnect()`, `getState()`, `onStateChange()` |

**Connection config:** `reconnectionDelay: 1000`, `reconnectionDelayMax: 5000`, `reconnectionAttempts: Infinity`.

**Event payload:** `JobCompletedEvent { jobId, eventId, provider, processingTime, timestamp }`

## Configuration

| Variable              | Required | Description                                                    |
| --------------------- | -------- | -------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL` | Yes      | Ingestion API URL for Socket.io (e.g. `http://localhost:3001`) |

## Development

```bash
# Prerequisites: Ingestion API running on :3001
cd apps/live-dashboard

# Watch mode
pnpm dev

# Build
pnpm build

# Production start
pnpm start
```

## Docker

```bash
# Via docker compose (builds with NEXT_PUBLIC_API_URL=http://localhost:3001)
docker compose up live-dashboard

# Standalone
docker build -f apps/live-dashboard/Dockerfile \
  --build-arg NEXT_PUBLIC_API_URL=http://localhost:3001 \
  -t live-dashboard .
```

Multi-stage Dockerfile: `node:24-alpine`, standalone output mode, healthcheck on port 3000.

**Note:** `NEXT_PUBLIC_API_URL` is baked at build time (Next.js static replacement).

## Performance Patterns

1. **Zustand over React Context** — Socket events update store outside React, avoiding re-render storms.
2. **Throttled chart updates** — Chart reads state every 1s, not per-event.
3. **TanStack Virtual** — Only visible rows are rendered in the event log (~5-6 at a time).
4. **`isAnimationActive={false}`** — Recharts animations disabled to reduce CPU.
5. **`getState()` polling** — MetricsCards avoids Zustand subscription, polls at 500ms.

## Key Decisions

- [ADR-0004: Zustand over React Context](../../docs/adr/0004-use-zustand-over-react-context-for-high-frequency-updates.md)
