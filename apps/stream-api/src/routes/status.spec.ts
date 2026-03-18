import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import fastify, { type FastifyInstance } from 'fastify';
import { statusRoutes } from './status';

declare module 'fastify' {
  interface FastifyInstance {
    statusService: { get: ReturnType<typeof vi.fn> };
  }
}

describe('Status Routes', () => {
  let app: FastifyInstance;
  const getMock = vi.fn();

  beforeAll(async () => {
    app = fastify();

    app.decorate('statusService', { get: getMock });

    await app.register(statusRoutes);
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return 200 with status record (excluding callbackUrl)', async () => {
    getMock.mockResolvedValueOnce({
      uploadId: 'upload-1',
      status: 'completed',
      objectKey: 'uploads/upload-1.csv',
      callbackUrl: 'http://secret.com/cb',
      createdAt: '2026-01-01T00:00:00Z',
      rowsProcessed: 100,
    });

    const response = await app.inject({
      method: 'GET',
      url: '/upload/upload-1/status',
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.uploadId).toBe('upload-1');
    expect(body.status).toBe('completed');
    expect(body.rowsProcessed).toBe(100);
    expect(body.callbackUrl).toBeUndefined();
  });

  it('should return 404 when uploadId not found', async () => {
    getMock.mockResolvedValueOnce(null);

    const response = await app.inject({
      method: 'GET',
      url: '/upload/missing-id/status',
    });

    expect(response.statusCode).toBe(404);
    expect(response.json().error).toBe('Upload not found');
  });
});
