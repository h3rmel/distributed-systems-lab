/** Processing lifecycle statuses */
export type ProcessingStatus = 'uploaded' | 'processing' | 'completed' | 'failed';

/** Stored in Redis per uploadId. Full job metadata */
export interface JobStatusRecord {
  uploadId: string;
  status: ProcessingStatus;
  callbackUrl?: string;
  objectKey: string;
  rowsProcessed?: number;
  rowsFailed?: number;
  error?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

/** Payload POSTed to user's callbackUrl */
export interface WebhookCallbackPayload {
  uploadId: string;
  status: 'completed' | 'failed';
  rowsProcessed: number;
  rowsFailed?: number;
  error?: string;
  timestamp: string; // ISO 8601
}

/** BullMQ job data for webhook delivery */
export interface WebhookJobData {
  uploadId: string;
  callbackUrl: string;
  payload: WebhookCallbackPayload;
}
