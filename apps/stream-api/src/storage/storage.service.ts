import { S3Client } from '@aws-sdk/client-s3';

/**
 * Creates an S3 client configured for either AWS S3 or MinIO (local dev).
 * Uses environment variables for configuration.
 */
export function createS3Client() {
  const endpoint = process.env.S3_ENDPOINT;
  const region = process.env.S3_REGION || 'us-east-1';
  const accessKeyId = process.env.S3_ACCESS_KEY || '';
  const secretAccessKey = process.env.S3_SECRET_KEY || '';

  const s3Client = new S3Client({
    endpoint,
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    forcePathStyle: true, // Required for MinIO
  });

  return s3Client;
}

// Singleton instance for the S3 client
export const s3Client = createS3Client();

export const getBucket = () => {
  const bucket = process.env.S3_BUCKET;

  if (!bucket) {
    throw new Error('S3_BUCKET is not set');
  }

  return bucket;
};
