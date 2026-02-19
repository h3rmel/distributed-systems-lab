import { Job, Worker } from 'bullmq';
import { WebhookJobData } from './types';
import { RedisConfig } from './redis.client';
import { WEBHOOK_QUEUE_NAME } from './webhook.queue';

/**
 * BullMQ Worker that consumes webhook delivery jobs.
 * POSTs the callback payload to the user's URL.
 * Throws on failure so BullMQ triggers automatic retry.
 */
export class WebhookWorker {
  private readonly worker: Worker<WebhookJobData>;

  constructor(config: RedisConfig) {
    this.worker = new Worker<WebhookJobData>(
      WEBHOOK_QUEUE_NAME,
      (job: Job<WebhookJobData>) => this.processJob(job),
      {
        connection: config,
        concurrency: 1,
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 500 },
      }
    );
    
    this.worker.on('completed', (job) => {
      console.log(`Webhook job ${job?.id} completed for uploadId=${job?.data.uploadId}`);
    });
    
    this.worker.on('failed', (job, error) => {
      console.log(
        `Webhook job ${job?.id} failed (attempt ${job?.attemptsMade}): ${error.message}`,
      );
    });
  }

  /** Processes a single webhook delivery job. */
  private async processJob(job: Job<WebhookJobData>): Promise<void> {
    const { callbackUrl, payload, uploadId } = job.data;

    console.log(`Delivering webhook for uploadId=${uploadId} to ${callbackUrl}`);

    const response = await fetch(callbackUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Webhook delivery failed: ${response.status} ${response.statusText}`);
    }

    console.log(`Webhook delivered for uploadId=${uploadId}`);
  }

  /** Gracefully shuts down the webhook worker. */
  async close(): Promise<void> {
    await this.worker.close();
  }
}
