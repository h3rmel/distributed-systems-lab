import { FastifyInstance } from "fastify";
import { parse } from "fast-csv";
import { pipeline } from "node:stream/promises";
import { downloadFileFromS3, deleteFileFromS3 } from "../storage";
import { createPostgresWriteStream } from "../streams/postgres-writer";
import { ValidationTransform } from "../transforms/validation";
import { FormatterTransform } from "../transforms/formatter";

/**
 * Processing routes for CSV file ingestion.
 * Stage 2: Object Storage → Database
 */
export async function processRoutes(app: FastifyInstance): Promise<void> {
  /**
   * POST /upload/:uploadId/process
   * Downloads file from S3, validates, and bulk inserts into Postgres.
   */
  app.post<{
    Params: { uploadId: string };
  }>('/upload/:uploadId/process', async (request, reply) => {
    const { uploadId } = request.params;
      const objectKey = `uploads/${uploadId}.csv`;

      let pgCleanup: (() => Promise<void>) | null = null;

      try {
        // 1. Download file stream from S3
        const s3Stream = await downloadFileFromS3(objectKey);

        // 2. Create transforms
        const csvParser = parse({ headers: true });
        const validationTransform = new ValidationTransform();
        const formatterTransform = new FormatterTransform();

        // 3. Create Postgres COPY stream
        const { stream: pgStream, done } = await createPostgresWriteStream();
        pgCleanup = done;

        // 4. Execute pipeline: S3 → CSV Parser → Validation → Formatter → Postgres
        await pipeline(
          s3Stream,
          csvParser,
          validationTransform,
          formatterTransform,
          pgStream
        );

        // 5. Cleanup: Release DB connection
        await pgCleanup();
        pgCleanup = null;

        // 6. Delete from S3 after successful processing
        await deleteFileFromS3(objectKey);

        // 7. Return success with stats
        const stats = validationTransform.getStats();
        return reply.status(200).send({
          success: true,
          uploadId,
          rowsProcessed: stats.total - stats.invalid,
          rowsInvalid: stats.invalid,
        });
      } catch (error: unknown) {
        if (pgCleanup) {
          await pgCleanup();
        }

        request.log.error(error, 'Processing failed');

        return reply.status(500).send({
          success: false,
          uploadId,
          error: error instanceof Error ? error.message : 'Unknown error',
          message: 'File kept in S3 for retry',
        })
      }
  });
}