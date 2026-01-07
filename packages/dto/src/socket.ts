/**
 * Event emitted when a webhook job is successfully processed
 * Sent from Ingestion API to Dashboard via WebSocket
 */
export interface JobCompletedEvent {
  jobId: string;
  eventId: string;
  provider: string;
  processingTime: number; // milliseconds
  timestamp: string; // ISO 8601 format
}

/**
 * Socket event names (prevents typos)
 */
export const SocketEvents = {
  JOB_COMPLETED: 'job-completed',
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
} as const;

/**
 * Type-safe socket event name
 */
export type SocketEventName = (typeof SocketEvents)[keyof typeof SocketEvents];
