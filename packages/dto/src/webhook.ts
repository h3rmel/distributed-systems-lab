/**
 * Webhook job data structure used by BullMQ queue
 * This is the payload sent to the background worker
 *
 * @template T - The type of the webhook data payload (provider-specific)
 */
export interface WebhookJobData<T = Record<string, unknown>> {
  provider: string;
  eventId: string;
  timestamp: string;
  data: T;
}

/**
 * Webhook event as stored in PostgreSQL database
 * This includes database-generated fields (id, createdAt)
 *
 * @template T - The type of the webhook data payload (provider-specific)
 */
export interface WebhookEvent<T = unknown> {
  id: number;
  provider: string;
  eventId: string;
  timestamp: Date;
  data: T;
  createdAt: Date;
}

/**
 * API response when webhook is successfully ingested
 * Returns immediately with HTTP 202 Accepted
 */
export interface IngestResponseDto {
  accepted: boolean;
  jobId: string;
}
