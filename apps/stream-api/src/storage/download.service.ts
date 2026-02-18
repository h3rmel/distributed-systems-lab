import { GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'node:stream';
import { getBucket, s3Client } from './storage.service';

/**
 * Downloads a file from S3/MinIO as a readable stream.
 * Used for processing files after upload.
 *
 * @param objectKey - S3 object key (e.g., "uploads/abc123.csv")
 * @returns Readable stream of the file contents
 * @throws Error if object doesn't exist or download fails
 */
export async function downloadFileFromS3(objectKey: string): Promise<Readable> {
  const bucket = getBucket();

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: objectKey,
  });

  const response = await s3Client.send(command);

  if (!response.Body) {
    throw new Error(`Empty response body for object: ${objectKey}`);
  }

  return response.Body as Readable;
}
