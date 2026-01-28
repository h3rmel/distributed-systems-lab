import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, getBucket } from './storage.service.js';

/**
 * Deletes a file from S3/MinIO.
 * Called after successful processing to clean up storage.
 *
 * @param objectKey - S3 object key to delete (e.g., "uploads/abc123.csv")
 * @returns Promise that resolves when deletion is complete
 */
export async function deleteFileFromS3(objectKey: string): Promise<void> {
  const bucket = getBucket();

  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: objectKey,
  });

  await s3Client.send(command);
}