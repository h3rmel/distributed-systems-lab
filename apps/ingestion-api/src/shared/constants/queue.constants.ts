/**
 * Queue name constants for BullMQ.
 * Used by both producers (WebhookService) and consumers (WebhookProcessor).
 */
export const QUEUE_NAMES = {
  WEBHOOKS: 'webhooks',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];
