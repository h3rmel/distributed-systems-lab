import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StatusService } from './status.service';
import type { JobStatusRecord } from './types';

const redisMock = {
  get: vi.fn(),
  set: vi.fn(),
};

describe('StatusService', () => {
  let service: StatusService;

  beforeEach(() => {
    vi.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    service = new StatusService(redisMock as any);
  });

  describe('create', () => {
    it('should create status record with TTL in Redis', async () => {
      redisMock.set.mockResolvedValueOnce('OK');

      const result = await service.create('upload-1', 'uploads/upload-1.csv', 'http://cb.test');

      expect(result.uploadId).toBe('upload-1');
      expect(result.status).toBe('uploaded');
      expect(result.objectKey).toBe('uploads/upload-1.csv');
      expect(result.callbackUrl).toBe('http://cb.test');
      expect(result.createdAt).toBeDefined();
      expect(redisMock.set).toHaveBeenCalledWith(
        'status:upload-1',
        expect.any(String),
        'EX',
        604_800,
      );
    });

    it('should create record without callbackUrl', async () => {
      redisMock.set.mockResolvedValueOnce('OK');

      const result = await service.create('upload-2', 'uploads/upload-2.csv');

      expect(result.callbackUrl).toBeUndefined();
    });
  });

  describe('get', () => {
    it('should return parsed JSON for existing uploadId', async () => {
      const record: JobStatusRecord = {
        uploadId: 'upload-1',
        status: 'completed',
        objectKey: 'uploads/upload-1.csv',
        createdAt: '2026-01-01T00:00:00Z',
      };
      redisMock.get.mockResolvedValueOnce(JSON.stringify(record));

      const result = await service.get('upload-1');

      expect(result).toEqual(record);
      expect(redisMock.get).toHaveBeenCalledWith('status:upload-1');
    });

    it('should return null for non-existent uploadId', async () => {
      redisMock.get.mockResolvedValueOnce(null);

      const result = await service.get('missing');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should merge partial update into existing record', async () => {
      const existing: JobStatusRecord = {
        uploadId: 'upload-1',
        status: 'uploaded',
        objectKey: 'uploads/upload-1.csv',
        createdAt: '2026-01-01T00:00:00Z',
      };
      redisMock.get.mockResolvedValueOnce(JSON.stringify(existing));
      redisMock.set.mockResolvedValueOnce('OK');

      const result = await service.update('upload-1', {
        status: 'processing',
        startedAt: '2026-01-01T00:01:00Z',
      });

      expect(result.status).toBe('processing');
      expect(result.startedAt).toBe('2026-01-01T00:01:00Z');
      expect(result.objectKey).toBe('uploads/upload-1.csv');
    });

    it('should throw when uploadId does not exist', async () => {
      redisMock.get.mockResolvedValueOnce(null);

      await expect(service.update('missing', { status: 'failed' })).rejects.toThrow(
        'Status record not found for uploadId: missing',
      );
    });

    it('should refresh TTL on update', async () => {
      const existing: JobStatusRecord = {
        uploadId: 'upload-1',
        status: 'uploaded',
        objectKey: 'key',
        createdAt: '2026-01-01T00:00:00Z',
      };
      redisMock.get.mockResolvedValueOnce(JSON.stringify(existing));
      redisMock.set.mockResolvedValueOnce('OK');

      await service.update('upload-1', { status: 'completed' });

      expect(redisMock.set).toHaveBeenCalledWith(
        'status:upload-1',
        expect.any(String),
        'EX',
        604_800,
      );
    });
  });
});
