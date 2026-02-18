import { Job, Worker } from 'bullmq';
import { WebhookJobData } from './types';
import { getRedisConfig } from './redis.client';

/** Queue name shared between worker and queue service. */
export const WEBHOOK_QUEUE_NAME = 'webhook-delivery';

/**
 * Processes a webhook delivery job.
 * POSTs the callback payload to the user's URL.
 * Throws on failure so BullMQ triggers automatic retry.
 */
async function processWebhookJob(job: Job<WebhookJobData>): Promise<void> {
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

/**
 * BullMQ Worker that consumes webhook delivery jobs.
 * Runs in-process with its own Redis connection.
 */
const webhookWorker = new Worker<WebhookJobData>(WEBHOOK_QUEUE_NAME, processWebhookJob, {
  connection: getRedisConfig(),
  concurrency: 1,
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 500 },
});

webhookWorker.on('completed', (job) => {
  console.log(`Webhook job ${job?.id} completed for uploadId=${job?.data.uploadId}`);
});

webhookWorker.on('failed', (job, error) => {
  console.log(`Webhook job ${job?.id} failed (attempt ${job?.attemptsMade}): ${error.message}`);
});

/**
 * Gracefully shuts down the webhook worker.
 * Call on SIGTERM/SIGINT in server.ts.
 */
export async function closeWebhookWorker(): Promise<void> {
  await webhookWorker.close();
}
