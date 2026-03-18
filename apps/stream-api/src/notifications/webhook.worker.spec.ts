import { describe, it, expect, vi, beforeEach } from 'vitest';

type ProcessorFn = (job: unknown) => Promise<void>;
type EventHandler = (...args: unknown[]) => void;
let processorFn: ProcessorFn | null = null;
const workerCloseMock = vi.fn().mockResolvedValue(undefined);
const eventHandlers = new Map<string, EventHandler>();

vi.mock('bullmq', () => ({
  Worker: class {
    close = workerCloseMock;
    constructor(_name: string, processor: ProcessorFn) {
      processorFn = processor;
    }
    on(event: string, handler: EventHandler) {
      eventHandlers.set(event, handler);
      return this;
    }
  },
}));

import { WebhookWorker } from './webhook.worker';

describe('WebhookWorker', () => {
  let worker: WebhookWorker;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
    worker = new WebhookWorker({ host: 'localhost', port: 6379 });
  });

  it('should POST payload to callbackUrl with JSON content-type', async () => {
    const fetchMock = vi.mocked(globalThis.fetch);
    fetchMock.mockResolvedValueOnce(new Response('OK', { status: 200 }));

    const job = {
      data: {
        uploadId: 'upload-1',
        callbackUrl: 'http://example.com/webhook',
        payload: { uploadId: 'upload-1', status: 'completed', rowsProcessed: 50, timestamp: '2026-01-01T00:00:00Z' },
      },
    };

    await processorFn!(job);

    expect(fetchMock).toHaveBeenCalledWith('http://example.com/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(job.data.payload),
    });
  });

  it('should throw on non-OK HTTP response', async () => {
    const fetchMock = vi.mocked(globalThis.fetch);
    fetchMock.mockResolvedValueOnce(new Response('Not Found', { status: 404, statusText: 'Not Found' }));

    const job = {
      data: {
        uploadId: 'upload-1',
        callbackUrl: 'http://example.com/webhook',
        payload: { uploadId: 'upload-1', status: 'failed', rowsProcessed: 0, timestamp: '2026-01-01T00:00:00Z' },
      },
    };

    await expect(processorFn!(job)).rejects.toThrow('Webhook delivery failed: 404 Not Found');
  });

  it('should log on completed event', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const handler = eventHandlers.get('completed');

    handler!({ id: 'job-42', data: { uploadId: 'upload-1' } });

    expect(spy).toHaveBeenCalledWith(expect.stringContaining('job-42'));
    spy.mockRestore();
  });

  it('should log on failed event', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const handler = eventHandlers.get('failed');

    handler!({ id: 'job-99', attemptsMade: 2, data: { uploadId: 'upload-1' } }, new Error('timeout'));

    expect(spy).toHaveBeenCalledWith(expect.stringContaining('job-99'));
    spy.mockRestore();
  });

  it('should call worker.close() on close()', async () => {
    await worker.close();

    expect(workerCloseMock).toHaveBeenCalledOnce();
  });
});
