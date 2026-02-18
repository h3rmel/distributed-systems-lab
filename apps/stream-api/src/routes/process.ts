import { FastifyInstance } from 'fastify';
import { parse } from 'fast-csv';
import { pipeline } from 'node:stream/promises';
import { downloadFileFromS3, deleteFileFromS3 } from '#/storage';
import { createPostgresWriteStream } from '#/streams/postgres-writer';
import { ValidationTransform } from '#/transforms/validation';
import { FormatterTransform } from '#/transforms/formatter';
import { getStatus, updateStatus } from '#/notifications/status.service';
import { WebhookCallbackPayload } from '#/notifications/types';
import { enqueueWebhook } from '#/notifications/webhook.queue';

/**
 * Processing routes for CSV file ingestion.
 * Stage 2: Object Storage → Database
 */
export async function processRoutes(app: FastifyInstance): Promise<void> {
  /**
   * POST /upload/:uploadId/process
   * Downloads file from S3, validates, and bulk inserts into Postgres.
   * Updates processing stauts in Redis and triggers webhook on completion.
   */
  app.post<{
    Params: { uploadId: string };
  }>('/upload/:uploadId/process', async (request, reply) => {
    const { uploadId } = request.params;
    const objectKey = `uploads/${uploadId}.csv`;

    let pgCleanup: (() => Promise<void>) | null = null;

    try {
      // 1. Update status to processing
      await updateStatus(uploadId, {
        status: 'processing',
        startedAt: new Date().toISOString(),
      });

      // 2. Download file stream from S3
      const s3Stream = await downloadFileFromS3(objectKey);

      // 3. Create transforms
      const csvParser = parse({ headers: true });
      const validationTransform = new ValidationTransform();
      const formatterTransform = new FormatterTransform();

      // 4. Create Postgres COPY stream
      const { stream: pgStream, done } = await createPostgresWriteStream();
      pgCleanup = done;

      // 5. Execute pipeline: S3 → CSV Parser → Validation → Formatter → Postgres
      await pipeline(s3Stream, csvParser, validationTransform, formatterTransform, pgStream);

      // 6. Cleanup: Release DB connection
      await pgCleanup();
      pgCleanup = null;

      // 7. Delete from S3 after successful processing
      await deleteFileFromS3(objectKey);

      // 8. Update status to completed
      const stats = validationTransform.getStats();
      const rowsProcessed = stats.total - stats.invalid;

      await updateStatus(uploadId, {
        status: 'completed',
        completedAt: new Date().toISOString(),
        rowsProcessed,
        rowsFailed: stats.invalid,
      });

      // 9. Enqueue webhook callback if callbackUrl is provided
      const record = await getStatus(uploadId);

      if (record?.callbackUrl) {
        const payload: WebhookCallbackPayload = {
          uploadId,
          status: 'completed',
          rowsProcessed,
          rowsFailed: stats.invalid,
          timestamp: new Date().toISOString(),
        };

        await enqueueWebhook(uploadId, record.callbackUrl, payload);
      }

      // 10. Return success with stats
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

      // Update status to failed and enqueue webhook (best-effort)
      try {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        await updateStatus(uploadId, {
          status: 'failed',
          error: errorMessage,
          completedAt: new Date().toISOString(),
        });

        const record = await getStatus(uploadId);
        if (record?.callbackUrl) {
          const payload: WebhookCallbackPayload = {
            uploadId,
            status: 'failed',
            rowsProcessed: 0,
            error: errorMessage,
            timestamp: new Date().toISOString(),
          };

          await enqueueWebhook(uploadId, record.callbackUrl, payload);
        }
      } catch (statusError) {
        request.log.error(statusError, 'Failed to update status after processing error');
      }

      return reply.status(500).send({
        success: false,
        uploadId,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'File kept in S3 for retry',
      });
    }
  });
}
