import { FastifyInstance } from 'fastify';
import { getStatus } from '#/notifications/status.service';

/**
 * Status polling routes for upload processing lifecycle.
 * Module F: Notification System - Status Endpoint.
 */
export async function statusRoutes(app: FastifyInstance): Promise<void> {
  /**
   * GET /upload/:uploadId/status
   * Returns the current processing status and metadata for a given upload.
   */
  app.get<{
    Params: { uploadId: string };
  }>('/upload/:uploadId/status', async (request, reply) => {
    const { uploadId } = request.params;

    const record = await getStatus(uploadId);

    if (!record) {
      return reply.status(404).send({
        error: 'Upload not found',
      });
    }

    const { callbackUrl, ...status } = record;

    return reply.status(200).send(status);
  });
}
