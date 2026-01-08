import { IsString, IsNotEmpty, IsObject, IsISO8601 } from 'class-validator';

/**
 * DTO for incoming webhook payloads.
 * Validated automatically by NestJS ValidationPipe.
 */
export class CreateWebhookDto {
  /**
   * Unique event identifier from the webhook provider.
   * Used for idempotency checks.
   * @example "evt_1N5abc123def456"
   */
  @IsString()
  @IsNotEmpty()
  eventId: string;

  /**
   * ISO 8601 timestamp when the event occurred.
   * @example "2026-01-08T14:30:00.000Z"
   */
  @IsISO8601()
  timestamp: string;

  /**
   * Provider-specific event data payload.
   * Structure varies by provider (Stripe, PayPal, etc.)
   */
  @IsObject()
  @IsNotEmpty()
  data: Record<string, unknown>;
}
