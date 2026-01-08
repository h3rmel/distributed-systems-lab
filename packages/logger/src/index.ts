/**
 * @distributed-systems-lab/logger
 *
 * Shared Pino logger configuration for consistent structured logging
 * across all Distributed Systems Lab services.
 *
 * @example
 *
 * import { createLogger } from '@distributed-systems-lab/logger';
 *
 * const logger = createLogger('my-service', { version: '1.0.0' });
 * logger.info({ userId: '123' }, 'User logged in');
 *  */

export { createLogger } from './logger';
export type { BaseLogContext, LogContext, ServiceLoggerOptions } from './types';
