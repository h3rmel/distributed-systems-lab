import { DeleteObjectCommand, GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Readable } from 'node:stream';

/** Configuration for S3/MinIO connection. */
export interface StorageConfig {
  endpoint?: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
}

/**
 * Manages all S3/MinIO object storage operations.
 * Consolidates upload, download, and delete into a single injectable service.
 */
export class StorageService {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(config: StorageConfig) {
    this.bucket = config.bucket;
    this.client = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: true, // Required for MinIO
    })
  }

  /**
   * Uploads a file stream to S3/MinIO.
   * Uses multipart upload for large files (handled automatically by @aws-sdk/lib-storage).
   *
   * @param fileStream - Readable stream from HTTP multipart upload
   * @param objectKey - S3 object key (e.g., "uploads/abc123.csv")
   * @returns Upload result containing location and ETag
   */
  async upload(
    fileStream: Readable,
    objectKey: string,
  ): Promise<{ location: string; etag: string | undefined }> {
    const upload = new Upload({
      client: this.client,
      params: {
        Bucket: this.bucket,
        Key: objectKey,
        Body: fileStream,
        ContentType: 'text/csv',
      }
    });

    const result = await upload.done();

    return {
      location: result.Location ?? `${this.bucket}/${objectKey}`,
      etag: result.ETag,
    }
  }

  /**
   * Downloads a file from S3/MinIO as a readable stream.
   *
   * @param objectKey - S3 object key (e.g., "uploads/abc123.csv")
   * @returns Readable stream of the file contents
   * @throws Error if object doesn't exist or response body is empty
   */
  async download(objectKey: string): Promise<Readable> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: objectKey,
    });

    const response = await this.client.send(command);
    
    if (!response.Body) {
      throw new Error(`Empty response body for object: ${objectKey}`);
    }

    return response.Body as Readable;
  }

  /**
   * Deletes a file from S3/MinIO.
   * Called after successful processing to clean up storage.
   *
   * @param objectKey - S3 object key to delete (e.g., "uploads/abc123.csv")
   */
  async delete(objectKey: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: objectKey,
    });

    await this.client.send(command);
  }

  /** Destroys the S3 client connection. */
  close(): void {
    this.client.destroy();
  }
}
