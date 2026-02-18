import { redis } from './redis.client';
import { JobStatusRecord } from './types';

const STATUS_KEY_PREFIX = 'status:';
const STATUS_TTL_SECONDS = 604_800; // 7 days

/**
 * Builds the Redis key for a given uploadId.
 */
function buildKey(uploadId: string): string {
  return `${STATUS_KEY_PREFIX}${uploadId}`;
}

/**
 * Creates initial job status after successful S3 upload.
 * Sets TTL of 7 days for automatic cleanup.
 */
export async function createStatus(
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

  await redis.set(buildKey(uploadId), JSON.stringify(record), 'EX', STATUS_TTL_SECONDS);

  return record;
}

/**
 * Updates and existing job status record.
 * Merges partial update into current record and refreshes TTL.
 *
 * @throws Error if uploadId not exist in Redis.
 */
export async function updateStatus(
  uploadId: string,
  update: Partial<JobStatusRecord>,
): Promise<JobStatusRecord> {
  const key = buildKey(uploadId);
  const raw = await redis.get(key);

  if (!raw) {
    throw new Error(`Status record not found for uploadId: ${uploadId}`);
  }

  const current: JobStatusRecord = JSON.parse(raw);
  const updated: JobStatusRecord = {
    ...current,
    ...update,
  };

  await redis.set(key, JSON.stringify(updated), 'EX', STATUS_TTL_SECONDS);

  return updated;
}

/**
 * Retrieves the current job status record for a given uploadId.
 * Returns null if the uploadId does not exist or has expired.
 */
export async function getStatus(uploadId: string) {
  const raw = await redis.get(buildKey(uploadId));

  if (!raw) {
    return null;
  }

  return JSON.parse(raw) as JobStatusRecord;
}
