import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Readable } from 'node:stream';

const sendMock = vi.fn();
const destroyMock = vi.fn();

vi.mock('@aws-sdk/client-s3', () => {
  return {
    S3Client: class {
      send = sendMock;
      destroy = destroyMock;
    },
    GetObjectCommand: class {
      constructor(public input: unknown) {}
    },
    DeleteObjectCommand: class {
      constructor(public input: unknown) {}
    },
  };
});

const doneMock = vi.fn().mockResolvedValue({
  Location: 'http://minio:9000/test-bucket/uploads/abc.csv',
  ETag: '"etag-123"',
});

vi.mock('@aws-sdk/lib-storage', () => ({
  Upload: class {
    done = doneMock;
  },
}));

import { StorageService } from './storage.service';

const config = {
  endpoint: 'http://localhost:9000',
  region: 'us-east-1',
  accessKeyId: 'test-key',
  secretAccessKey: 'test-secret',
  bucket: 'test-bucket',
};

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(() => {
    vi.clearAllMocks();
    doneMock.mockResolvedValue({
      Location: 'http://minio:9000/test-bucket/uploads/abc.csv',
      ETag: '"etag-123"',
    });
    service = new StorageService(config);
  });

  it('should upload stream and return location + etag', async () => {
    const stream = Readable.from(['data']);

    const result = await service.upload(stream, 'uploads/abc.csv');

    expect(result.location).toBe('http://minio:9000/test-bucket/uploads/abc.csv');
    expect(result.etag).toBe('"etag-123"');
  });

  it('should fallback location when S3 returns no Location', async () => {
    doneMock.mockResolvedValueOnce({ Location: undefined, ETag: '"etag"' });
    const stream = Readable.from(['data']);

    const result = await service.upload(stream, 'uploads/xyz.csv');

    expect(result.location).toBe('test-bucket/uploads/xyz.csv');
  });

  it('should download object and return Readable stream', async () => {
    const mockBody = Readable.from(['csv,data']);
    sendMock.mockResolvedValueOnce({ Body: mockBody });

    const result = await service.download('uploads/abc.csv');

    expect(result).toBe(mockBody);
  });

  it('should throw when download response body is empty', async () => {
    sendMock.mockResolvedValueOnce({ Body: null });

    await expect(service.download('uploads/abc.csv')).rejects.toThrow(
      'Empty response body for object: uploads/abc.csv',
    );
  });

  it('should delete object from S3 bucket', async () => {
    sendMock.mockResolvedValueOnce({});

    await expect(service.delete('uploads/abc.csv')).resolves.toBeUndefined();
    expect(sendMock).toHaveBeenCalledOnce();
  });

  it('should propagate S3 errors on download failure', async () => {
    sendMock.mockRejectedValueOnce(new Error('NoSuchKey'));

    await expect(service.download('missing.csv')).rejects.toThrow('NoSuchKey');
  });

  it('should destroy S3 client on close()', () => {
    service.close();

    expect(destroyMock).toHaveBeenCalledOnce();
  });
});
