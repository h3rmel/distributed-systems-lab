import { JobCompletedEvent } from '@distributed-systems-lab/dto';

/** Nest DI token for notifying consumers that a webhook job completed (e.g. dashboard). */
export const JOB_COMPLETED_NOTIFIER = Symbol('JOB_COMPLETED_NOTIFIER');

/**
 * Port for publishing job-completion facts without coupling workers to Socket.io.
 */
export interface JobCompletedNotifier {
  notifyJobCompleted(event: JobCompletedEvent): void;
}
