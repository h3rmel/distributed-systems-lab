import { FastifyInstance } from 'fastify';
import { randomUUID } from 'node:crypto';
import { uploadFileToS3 } from '../storage/index.js';

/**
 * Upload routes for CSV file ingestion.
 * Stage 1: HTTP → Object Storage (S3/MinIO)
 */
export async function uploadRoutes(app: FastifyInstance): Promise<void> {
  /**
   * POST /upload
   * Accepts multipart file upload and streams directly to S3.
   * Returns 202 Accepted with uploadId for tracking.
   */
  app.post('/upload', async (request, reply) => {
    // 1. Get file from multipart request
    const data = await request.file();

    if (!data) {
      return reply.status(400).send({ error: 'No file uploaded' });
    }

    // 2. Generate unique upload ID and object key
    const uploadId = randomUUID();
    const objectKey = `uploads/${uploadId}.csv`;

    try {
      // 3. Stream HTTP file directly to S3 (no disk, no memory)
      const result = await uploadFileToS3(data.file, objectKey);

      // 4. Return 202 Accepted with tracking info
      return reply.status(202).send({
        uploadId,
        objectKey,
        status: 'uploaded',
        location: result.location,
      });
    } catch (error) {
      request.log.error(error, 'Upload failed');
      return reply.status(500).send({
        error: 'Upload failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
}