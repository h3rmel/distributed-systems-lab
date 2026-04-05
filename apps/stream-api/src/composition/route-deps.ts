import type { StorageService } from '#/storage/storage.service';
import type { StatusService } from '#/notifications/status.service';
import type { WebhookQueue } from '#/notifications/webhook.queue';
import type { DatabaseService } from '#/streams/postgres-writer';

/** Dependencies for POST /upload */
export interface UploadRouteDeps {
  storageService: StorageService;
  statusService: StatusService;
}

/** Dependencies for POST /upload/:uploadId/process */
export interface ProcessRouteDeps {
  storageService: StorageService;
  statusService: StatusService;
  webhookQueue: WebhookQueue;
  databaseService: DatabaseService;
}

/** Dependencies for GET /upload/:uploadId/status */
export interface StatusRouteDeps {
  statusService: StatusService;
}
