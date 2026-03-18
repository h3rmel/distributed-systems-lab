import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { WebhookCallbackPayload } from './types';

const addMock = vi.fn().mockResolvedValue({ id: 'job-1' });
const closeMock = vi.fn().mockResolvedValue(undefined);

let capturedQueueName: string | undefined;
let capturedQueueOpts: Record<string, unknown> | undefined;

vi.mock('bullmq', () => ({
  Queue: class {
    add = addMock;
    close = closeMock;
    constructor(name: string, opts: Record<string, unknown>) {
      capturedQueueName = name;
      capturedQueueOpts = opts;
    }
  },
}));

import { WebhookQueue } from './webhook.queue';

describe('WebhookQueue', () => {
  let queue: WebhookQueue;

  beforeEach(() => {
    vi.clearAllMocks();
    queue = new WebhookQueue({ host: 'localhost', port: 6379 });
  });

  it('should enqueue job with correct data', async () => {
    const payload: WebhookCallbackPayload = {
      uploadId: 'upload-1',
      status: 'completed',
      rowsProcessed: 100,
      timestamp: '2026-01-01T00:00:00Z',
    };

    await queue.enqueue('upload-1', 'http://example.com/cb', payload);

    expect(addMock).toHaveBeenCalledWith('webhook-callback', {
      uploadId: 'upload-1',
      callbackUrl: 'http://example.com/cb',
      payload,
    });
  });

  it('should configure retry policy via Queue constructor', () => {
    expect(capturedQueueName).toBe('webhook-delivery');
    expect(capturedQueueOpts).toMatchObject({
      connection: { host: 'localhost', port: 6379 },
      defaultJobOptions: expect.objectContaining({
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
      }),
    });
  });

  it('should call queue.close() on close()', async () => {
    await queue.close();

    expect(closeMock).toHaveBeenCalledOnce();
  });
});
