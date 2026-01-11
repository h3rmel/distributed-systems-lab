/**
 * Creates a valid CreateWebhookDto for testing.
 * Can be overridden with partial data.
 */
export function createTestWebhookDto(overrides?: {
  eventId?: string;
  timestamp?: string;
  data?: Record<string, unknown>;
}) {
  return {
    eventId: overrides?.eventId ?? 'evt_test_001',
    timestamp: overrides?.timestamp ?? '2026-01-10T16:00:00.000Z',
    data: overrides?.data ?? { type: 'test', amount: 100 },
  };
}

/**
 * Creates a valid WebhookJobData for testing.
 * Can be overridden with partial data.
 */
export function createTestJobData(overrides?: {
  provider?: string;
  eventId?: string;
  timestamp?: string;
  data?: Record<string, unknown>;
}) {
  return {
    provider: overrides?.provider ?? 'stripe',
    eventId: overrides?.eventId ?? 'evt_test_001',
    timestamp: overrides?.timestamp ?? '2026-01-10T16:00:00.000Z',
    data: overrides?.data ?? { type: 'test', amount: 100 },
  };
}
