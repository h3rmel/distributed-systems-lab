import { Job, Queue } from 'bullmq';
import { WebhookCallbackPayload, WebhookJobData } from './types';
import { RedisConfig } from './redis.client';

/** Queue name shared between WebhookQueue and WebhookWorker. */
export const WEBHOOK_QUEUE_NAME = 'webhook-delivery';

/**
 * Manages the BullMQ queue for webhook delivery jobs.
 * Retry policy: 3 attempts with exponential backoff.
 */
export class WebhookQueue {
  private readonly queue: Queue<WebhookJobData>;

  constructor(config: RedisConfig) {
    this.queue = new Queue<WebhookJobData>(WEBHOOK_QUEUE_NAME, {
      connection: config,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    })
  }

  /**
   * Enqueues a webhook delivery job for async processing.
   * Called by the process route after pipeline completion/failure.
   */
  async enqueue(
    uploadId: string,
    callbackUrl: string,
    payload: WebhookCallbackPayload,
  ): Promise<Job<WebhookJobData>> {
    const jobData: WebhookJobData = {
      uploadId,
      callbackUrl,
      payload,
    };

    return this.queue.add('webhook-callback', jobData);
  }

  /**
   * Gracefully shuts down the webhook queue.
   * Call on SIGTERM/SIGINT in server.ts.
   */
  async close(): Promise<void> {
    await this.queue.close();
  }
}
