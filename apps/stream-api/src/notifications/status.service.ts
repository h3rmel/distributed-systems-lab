import Redis from 'ioredis';
import { JobStatusRecord } from './types';

const STATUS_KEY_PREFIX = 'status:';
const STATUS_TTL_SECONDS = 604_800; // 7 days

/**
 * Manages upload processing status records in Redis.
 * Each upload gets a JSON record with TTL for automatic cleanup.
 */
export class StatusService {
  constructor(private readonly redis: Redis) {}

  /**
   * Creates initial job status after successful S3 upload.
   * Sets TTL of 7 days for automatic cleanup.
   */
  async create(
    uploadId: string,
    objectKey: string,
    callbackUrl?: string,
  ): Promise<JobStatusRecord> {
    const record: JobStatusRecord = {
      uploadId,
      status: 'uploaded',
      objectKey,
      callbackUrl,
      createdAt: new Date().toISOString(),
    };

    await this.redis.set(
      this.buildKey(uploadId),
      JSON.stringify(record),
      'EX',
      STATUS_TTL_SECONDS,
    );

    return record;
  }

  /**
   * Updates an existing job status record.
   * Merges partial update into current record and refreshes TTL.
   *
   * @throws Error if uploadId does not exist in Redis
   */
  async update(
    uploadId: string,
    update: Partial<JobStatusRecord>,
  ): Promise<JobStatusRecord> {
    const key = this.buildKey(uploadId);
    const raw = await this.redis.get(key);

    if (!raw) {
      throw new Error(`Status record not found for uploadId: ${uploadId}`);
    }

    const current: JobStatusRecord = JSON.parse(raw);
    const updated: JobStatusRecord = {
      ...current,
      ...update,
    };

    await this.redis.set(key, JSON.stringify(updated), 'EX', STATUS_TTL_SECONDS);

    return updated;
  }

  /**
   * Retrieves the current job status record for a given uploadId.
   * Returns null if the uploadId does not exist or has expired.
   */
  async get(uploadId: string): Promise<JobStatusRecord | null> {
    const raw = await this.redis.get(this.buildKey(uploadId));

    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as JobStatusRecord;
  }
  
  /** Builds the Redis key for a given uploadId. */
  private buildKey(uploadId: string): string {
    return `${STATUS_KEY_PREFIX}${uploadId}`;
  }
}
