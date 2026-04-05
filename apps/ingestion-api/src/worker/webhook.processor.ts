import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { DATABASE_CONNECTION, type DatabaseConnection } from 'src/database';
import { QUEUE_NAMES } from 'src/shared/constants/queue.constants';
import { IdempotencyService } from './idempotency.service';
import { Job } from 'bullmq';
import { WebhookJobData } from '@distributed-systems-lab/dto';
import { webhookEvents } from '@distributed-systems-lab/database';
import {
  JOB_COMPLETED_NOTIFIER,
  type JobCompletedNotifier,
} from 'src/metrics/job-completed-notifier';

/**
 * Background processor for webhook events.
 * Consumes jobs from the webhooks queue and persists them to PostgreSQL.
 * Implements idempotency checks to prevent duplicate processing.
 *
 * **Ordering note:** DB insert and Redis idempotency mark are not atomic. If the process
 * crashes after insert but before `markProcessed`, a retry could duplicate the row unless
 * DB uniqueness on `event_id` rejects it — acceptable tradeoff for this lab.
 */
@Processor(QUEUE_NAMES.WEBHOOKS)
export class WebhookProcessor extends WorkerHost {
  constructor(
    @InjectPinoLogger(WebhookProcessor.name)
    private readonly logger: PinoLogger,
    @Inject(DATABASE_CONNECTION) private readonly db: DatabaseConnection,
    private readonly idempotencyService: IdempotencyService,
    @Inject(JOB_COMPLETED_NOTIFIER)
    private readonly jobCompletedNotifier: JobCompletedNotifier,
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
    const { eventId, provider, timestamp } = job.data;

    this.logger.info('Processing webhook', {
      eventId,
      provider,
      timestamp,
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
      data: job.data.data,
    });

    await this.idempotencyService.markProcessed(eventId);

    const processingTime = Date.now() - (job.processedOn ?? Date.now());

    this.jobCompletedNotifier.notifyJobCompleted({
      jobId: job.id ?? 'unknown',
      eventId,
      provider,
      processingTime,
      timestamp: new Date().toISOString(),
    });

    this.logger.debug('WebSocket event emitted', {
      event: 'job-completed',
      eventId,
      provider,
      processingTime,
    });

    this.logger.info('Webhook processed', {
      eventId,
      provider,
      jobId: job.id,
    });
  }
}
