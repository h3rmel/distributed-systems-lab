import { Job, Queue } from 'bullmq';
import { WebhookCallbackPayload, WebhookJobData } from './types';
import { WEBHOOK_QUEUE_NAME } from './webhook.worker';
import { getRedisConfig } from './redis.client';

/**
 * BullMQ Queue for webhook delivery jobs.
 * Retry policy: 3 attempts w/ exponential backoff.
 */
const webhookQueue = new Queue<WebhookJobData>(WEBHOOK_QUEUE_NAME, {
  connection: getRedisConfig(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

/**
 * Enqueues a webhook delivery job for async processing.
 * Called by the process route after pipeline completion/failure.
 */
export async function enqueueWebhook(
  uploadId: string,
  callbackUrl: string,
  payload: WebhookCallbackPayload,
): Promise<Job<WebhookJobData>> {
  const jobData: WebhookJobData = {
    uploadId,
    callbackUrl,
    payload,
  };

  return webhookQueue.add('webhook-callback', jobData);
}

/**
 * Gracefully shuts down the webhook queue.
 * Call on SIGTERM/SIGINT in server.ts.
 */
export async function closeWebhookQueue(): Promise<void> {
  await webhookQueue.close();
}
