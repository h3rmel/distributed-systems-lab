import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import fastify, { type FastifyInstance } from 'fastify';
import { Readable, Writable } from 'node:stream';
import { processRoutes } from './process';

declare module 'fastify' {
  interface FastifyInstance {
    storageService: {
      download: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
    };
    statusService: {
      update: ReturnType<typeof vi.fn>;
      get: ReturnType<typeof vi.fn>;
    };
    webhookQueue: {
      enqueue: ReturnType<typeof vi.fn>;
    };
    databaseService: {
      createCopyStream: ReturnType<typeof vi.fn>;
    };
  }
}

function createMockPgStream(): Writable {
  return new Writable({
    write(_chunk, _encoding, callback) {
      callback();
    },
  });
}

function createCsvStream(content: string): Readable {
  return Readable.from([content]);
}

describe('Process Routes', () => {
  let app: FastifyInstance;
  const downloadMock = vi.fn();
  const deleteMock = vi.fn();
  const updateMock = vi.fn();
  const getMock = vi.fn();
  const enqueueMock = vi.fn();
  const createCopyStreamMock = vi.fn();
  const doneMock = vi.fn();

  beforeAll(async () => {
    app = fastify();

    app.decorate('storageService', { download: downloadMock, delete: deleteMock });
    app.decorate('statusService', { update: updateMock, get: getMock });
    app.decorate('webhookQueue', { enqueue: enqueueMock });
    app.decorate('databaseService', { createCopyStream: createCopyStreamMock });

    await app.register(processRoutes);
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    vi.resetAllMocks();
    doneMock.mockResolvedValue(undefined);
  });

  it('should return 200 with rowsProcessed on success', async () => {
    const csv = 'provider,eventId,timestamp,data\ngithub,evt-1,2026-01-01T00:00:00Z,test\n';
    downloadMock.mockResolvedValueOnce(createCsvStream(csv));
    createCopyStreamMock.mockResolvedValueOnce({ stream: createMockPgStream(), done: doneMock });
    updateMock.mockResolvedValue({});
    deleteMock.mockResolvedValueOnce(undefined);
    getMock.mockResolvedValueOnce(null);

    const response = await app.inject({
      method: 'POST',
      url: '/upload/upload-1/process',
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.success).toBe(true);
    expect(body.uploadId).toBe('upload-1');
    expect(body.rowsProcessed).toBe(1);
    expect(body.rowsInvalid).toBe(0);
  });

  it('should update status to processing then completed', async () => {
    const csv = 'provider,eventId,timestamp,data\ngithub,evt-1,2026-01-01T00:00:00Z,test\n';
    downloadMock.mockResolvedValueOnce(createCsvStream(csv));
    createCopyStreamMock.mockResolvedValueOnce({ stream: createMockPgStream(), done: doneMock });
    updateMock.mockResolvedValue({});
    deleteMock.mockResolvedValueOnce(undefined);
    getMock.mockResolvedValueOnce(null);

    await app.inject({ method: 'POST', url: '/upload/upload-1/process' });

    const statusCalls = updateMock.mock.calls.map((c: unknown[]) => (c[1] as { status: string }).status);
    expect(statusCalls).toContain('processing');
    expect(statusCalls).toContain('completed');
  });

  it('should delete S3 object after successful processing', async () => {
    const csv = 'provider,eventId,timestamp,data\ngithub,evt-1,2026-01-01T00:00:00Z,test\n';
    downloadMock.mockResolvedValueOnce(createCsvStream(csv));
    createCopyStreamMock.mockResolvedValueOnce({ stream: createMockPgStream(), done: doneMock });
    updateMock.mockResolvedValue({});
    deleteMock.mockResolvedValueOnce(undefined);
    getMock.mockResolvedValueOnce(null);

    await app.inject({ method: 'POST', url: '/upload/upload-1/process' });

    expect(deleteMock).toHaveBeenCalledWith('uploads/upload-1.csv');
  });

  it('should enqueue webhook callback when callbackUrl exists', async () => {
    const csv = 'provider,eventId,timestamp,data\ngithub,evt-1,2026-01-01T00:00:00Z,test\n';
    downloadMock.mockResolvedValueOnce(createCsvStream(csv));
    createCopyStreamMock.mockResolvedValueOnce({ stream: createMockPgStream(), done: doneMock });
    updateMock.mockResolvedValue({});
    deleteMock.mockResolvedValueOnce(undefined);
    getMock.mockResolvedValueOnce({ callbackUrl: 'http://example.com/hook' });
    enqueueMock.mockResolvedValueOnce({});

    await app.inject({ method: 'POST', url: '/upload/upload-1/process' });

    expect(enqueueMock).toHaveBeenCalledWith(
      'upload-1',
      'http://example.com/hook',
      expect.objectContaining({ status: 'completed', uploadId: 'upload-1' }),
    );
  });

  it('should return 500 and update status to failed on pipeline error', async () => {
    downloadMock.mockRejectedValueOnce(new Error('S3 download failed'));
    updateMock.mockResolvedValue({});
    getMock.mockResolvedValueOnce(null);

    const response = await app.inject({
      method: 'POST',
      url: '/upload/upload-1/process',
    });

    expect(response.statusCode).toBe(500);
    expect(response.json().success).toBe(false);

    const failedCall = updateMock.mock.calls.find(
      (c: unknown[]) => (c[1] as { status: string }).status === 'failed',
    );
    expect(failedCall).toBeDefined();
  });

  it('should enqueue failed webhook when callbackUrl exists on error', async () => {
    downloadMock.mockRejectedValueOnce(new Error('S3 down'));
    updateMock.mockResolvedValue({});
    getMock.mockResolvedValueOnce({ callbackUrl: 'http://example.com/hook' });
    enqueueMock.mockResolvedValueOnce({});

    const response = await app.inject({
      method: 'POST',
      url: '/upload/upload-1/process',
    });

    expect(response.statusCode).toBe(500);
    expect(enqueueMock).toHaveBeenCalledWith(
      'upload-1',
      'http://example.com/hook',
      expect.objectContaining({ status: 'failed', uploadId: 'upload-1' }),
    );
  });

  it('should handle status update failure after processing error gracefully', async () => {
    downloadMock.mockRejectedValueOnce(new Error('S3 down'));
    updateMock.mockRejectedValueOnce(new Error('Redis down'));

    const response = await app.inject({
      method: 'POST',
      url: '/upload/upload-1/process',
    });

    expect(response.statusCode).toBe(500);
    expect(response.json().success).toBe(false);
  });

  it('should return 500 with "Unknown error" for non-Error throws', async () => {
    downloadMock.mockRejectedValueOnce('raw-string-error');
    updateMock.mockResolvedValue({});
    getMock.mockResolvedValueOnce(null);

    const response = await app.inject({
      method: 'POST',
      url: '/upload/upload-1/process',
    });

    expect(response.statusCode).toBe(500);
    expect(response.json().error).toBe('Unknown error');
  });
});
