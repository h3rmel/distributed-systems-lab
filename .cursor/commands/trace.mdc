---
description: Trace execution flow from entry point to completion.
---

# `/trace [function/flow]`

**Purpose:** Trace execution flow from entry point to completion.

**AI Actions:**
1. Identify entry point (controller, event handler, etc.)
2. Follow execution path step by step:
   - Function calls
   - Service injections
   - Database queries
   - Queue operations
   - Error handling paths
3. Create visual flow representation:
   ```
   POST /webhooks/:provider
   ↓
   WebhookController.ingest()
   ↓
   ValidationPipe validates CreateWebhookDto
   ↓
   WebhookService.enqueue()
   ↓
   BullMQ.add('webhooks', jobData)
   ↓
   Return 202 Accepted
   ↓ (async)
   WebhookProcessor.handleJob()
   ↓
   Check idempotency (Redis)
   ↓
   Save to Database (Drizzle)
   ```
4. Highlight:
   - Async boundaries
   - Error handling points
   - External dependencies
   - Performance bottlenecks
5. Ask: "Do you need more detail on any step?"

**Example:**
```
User: /trace webhook ingestion flow
AI: [Traces complete flow from API to database with visual diagram]
```
