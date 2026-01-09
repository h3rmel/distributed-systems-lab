import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { DATABASE_CONNECTION, type DatabaseConnection } from 'src/database';
import { QUEUE_NAMES } from 'src/shared/constants/queue.constants';
import { IdempotencyService } from './idempotency.service';
import { Job } from 'bullmq';
import { WebhookJobData } from '@distributed-systems-lab/dto';
import { webhookEvents } from '@distributed-systems-lab/database';

/**
 * Background processor for webhook events.
 * Consumes jobs from the webhooks queue and persists them to PostgreSQL.
 * Implements idempotency checks to prevent duplicate processing.
 */
@Processor(QUEUE_NAMES.WEBHOOKS)
export class WebhookProcessor extends WorkerHost {
  constructor(
    @InjectPinoLogger(WebhookProcessor.name)
    private readonly logger: PinoLogger,
    @Inject(DATABASE_CONNECTION) private readonly db: DatabaseConnection,
    private readonly idempotencyService: IdempotencyService,
  ) {
    super();
  }

  /**
   * Processes a webhook job from the queue.
   * Flow: Idempotency check → Database insert → Mark processed
   *
   * @param job - BullMQ job containing WebhookJobData payload
   */
  async process(job: Job<WebhookJobData>): Promise<void> {
    const { eventId, provider, timestamp, data } = job.data;

    this.logger.info('Processing webhook', {
      eventId,
      provider,
      timestamp,
      data,
    });

    const alreadyProcessed = await this.idempotencyService.isProcessed(eventId);

    if (alreadyProcessed) {
      this.logger.warn({ eventId, provider }, 'Duplicate event skipped');
      return;
    }

    await this.db.insert(webhookEvents).values({
      provider,
      eventId,
      timestamp: new Date(timestamp),
      data,
    });

    await this.idempotencyService.markProcessed(eventId);

    this.logger.info('Webhook processed', {
      eventId,
      provider,
      jobId: job.id,
    });
  }
}
