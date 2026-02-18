# ADR-0007: Notification System for Stream API File Processing

## Status

Accepted

## Context

The Stream API processes large CSV files (2GB+) asynchronously, which can take minutes or hours to complete. Users need to know when their file processing is complete without:

- Constantly polling the API
- Keeping a WebSocket connection open (impractical for long-running jobs)
- Manually checking the dashboard

**Requirements:**

- Users upload files and receive immediate 202 Accepted response
- Processing happens asynchronously (can take minutes/hours)
- Users need notification when processing completes or fails
- System must work for users who may not have exposed endpoints
- Must support both push and pull notification patterns

**Alternatives considered:**

1. **Status Polling Only:** Simple but inefficient, requires constant polling
2. **Webhook Callback Only:** Efficient but requires users to expose endpoints
3. **Email Notifications:** Simple but requires email service configuration
4. **WebSocket:** Only works if user stays connected (not practical for long jobs)
5. **Hybrid (Polling + Webhook):** Best of both worlds - always available polling + optional push notifications

## Decision

We will implement a **hybrid notification system** combining:

1. **Status Polling Endpoint** (always available)
2. **Optional Webhook Callback** (push notification)

**Architecture:**

- Upload endpoint accepts optional `callbackUrl` parameter
- Status endpoint provides real-time processing status
- Webhook service POSTs to user's callback URL on completion/failure
- Retry mechanism for failed webhook deliveries

## Consequences

### Positive

- **Flexibility:** Users can choose polling or webhooks based on their needs
- **Reliability:** Status endpoint always available (no external dependencies)
- **Efficiency:** Webhooks eliminate need for constant polling
- **Scalability:** Webhook delivery can be queued/retried asynchronously
- **User Experience:** Users get immediate feedback without manual checking

### Negative

- **Complexity:** Need to implement both polling and webhook systems
- **Webhook Reliability:** Must handle user endpoint failures gracefully
- **Storage:** Need to store processing status and callback URLs
- **Retry Logic:** Need to implement retry mechanism for failed webhooks

### Implementation Notes

- Store processing status in database (or Redis) with uploadId as key
- Status endpoint: `GET /upload/:uploadId/status`
- Webhook service: POST to user's callbackUrl with processing result
- Retry failed webhooks with exponential backoff (max 3 retries)
- Webhook payload: `{ uploadId, status: 'completed' | 'failed', rowsProcessed, error?, timestamp }`
- Use BullMQ or similar queue for webhook delivery (async, retryable)

## References

- [SPEC-STREAM-API.md](../SPEC-STREAM-API.md)
