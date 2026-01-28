import type { Readable } from "node:stream";
import { getBucket, s3Client } from "./storage.service";
import { Upload } from "@aws-sdk/lib-storage";

/**
 * Uploads a file stream to S3/MinIO.
 * Uses multipart upload for large files (handled automatically by @aws-sdk/lib-storage).
 * 
 * @param fileStream - Readable stream from HTTP multipart upload
 * @param objectKey - S3 object key (e.g., "uploads/abc123.csv")
 * @returns Promise with upload result containing Location and ETag
 */
export async function uploadFileToS3(
  fileStream: Readable,
  objectKey: string,
): Promise<{ location: string; etag: string | undefined}> {
  const bucket = getBucket();

  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: bucket,
      Key: objectKey,
      Body: fileStream,
      ContentType: 'text/csv',
    },
  });

  const result = await upload.done();

  return {
    location: result.Location ?? `${bucket}/${objectKey}`,
    etag: result.ETag,
  }
}