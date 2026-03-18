import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import fastify, { type FastifyInstance } from 'fastify';
import multipart from '@fastify/multipart';
import { uploadRoutes } from './upload';

declare module 'fastify' {
  interface FastifyInstance {
    storageService: { upload: ReturnType<typeof vi.fn> };
    statusService: { create: ReturnType<typeof vi.fn> };
  }
}

describe('Upload Routes', () => {
  let app: FastifyInstance;
  const uploadMock = vi.fn();
  const createMock = vi.fn();

  beforeAll(async () => {
    app = fastify();

    await app.register(multipart);

    app.decorate('storageService', { upload: uploadMock });
    app.decorate('statusService', { create: createMock });

    await app.register(uploadRoutes);
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return 202 with uploadId on successful upload', async () => {
    uploadMock.mockResolvedValueOnce({ location: 'http://minio/bucket/file.csv', etag: '"e"' });
    createMock.mockResolvedValueOnce({});

    const response = await app.inject({
      method: 'POST',
      url: '/upload',
      headers: { 'content-type': 'multipart/form-data; boundary=----formdata' },
      payload:
        '------formdata\r\n' +
        'Content-Disposition: form-data; name="file"; filename="test.csv"\r\n' +
        'Content-Type: text/csv\r\n\r\n' +
        'provider,eventId,timestamp,data\n' +
        '------formdata--\r\n',
    });

    expect(response.statusCode).toBe(202);
    const body = response.json();
    expect(body.uploadId).toBeDefined();
    expect(body.status).toBe('uploaded');
  });

  it('should return 400 when no file is uploaded', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/upload',
      headers: { 'content-type': 'multipart/form-data; boundary=----formdata' },
      payload: '------formdata--\r\n',
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toBe('No file uploaded');
  });

  it('should return 400 for invalid callbackUrl format', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/upload?callbackUrl=not-a-url',
      headers: { 'content-type': 'multipart/form-data; boundary=----formdata' },
      payload:
        '------formdata\r\n' +
        'Content-Disposition: form-data; name="file"; filename="test.csv"\r\n' +
        'Content-Type: text/csv\r\n\r\n' +
        'data\n' +
        '------formdata--\r\n',
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toContain('Invalid callbackUrl');
  });

  it('should return 500 when S3 upload fails', async () => {
    uploadMock.mockRejectedValueOnce(new Error('S3 connection refused'));

    const response = await app.inject({
      method: 'POST',
      url: '/upload',
      headers: { 'content-type': 'multipart/form-data; boundary=----formdata' },
      payload:
        '------formdata\r\n' +
        'Content-Disposition: form-data; name="file"; filename="test.csv"\r\n' +
        'Content-Type: text/csv\r\n\r\n' +
        'data\n' +
        '------formdata--\r\n',
    });

    expect(response.statusCode).toBe(500);
    expect(response.json().error).toBe('Upload failed');
    expect(response.json().message).toBe('S3 connection refused');
  });

  it('should return "Unknown error" when non-Error is thrown', async () => {
    uploadMock.mockRejectedValueOnce('string-error');

    const response = await app.inject({
      method: 'POST',
      url: '/upload',
      headers: { 'content-type': 'multipart/form-data; boundary=----formdata' },
      payload:
        '------formdata\r\n' +
        'Content-Disposition: form-data; name="file"; filename="test.csv"\r\n' +
        'Content-Type: text/csv\r\n\r\n' +
        'data\n' +
        '------formdata--\r\n',
    });

    expect(response.statusCode).toBe(500);
    expect(response.json().message).toBe('Unknown error');
  });
});
