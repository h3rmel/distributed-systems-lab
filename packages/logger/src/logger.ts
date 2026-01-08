import pino, { Logger } from 'pino';
import type { BaseLogContext, ServiceLoggerOptions } from './types';

/**
 * Default pino configuration for production (JSON output)
 */
const productionConfig: pino.LoggerOptions = {
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
};

/**
 * Development configuration (pretty printing via pino-pretty)
 */
const developmentConfig: pino.LoggerOptions = {
  level: process.env.LOG_LEVEL || 'debug',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  },
};

/**
 * Creates a configured Pino logger instance for a specific service
 *
 * @param serviceName - Name of the service (e.g., 'ingestion-api')
 * @param options - Optional configuration overrides
 * @returns Configured Pino logger with service context
 *
 * @example
 *
 * import { createLogger } from '@distributed-systems-lab/logger';
 *
 * const logger = createLogger('ingestion-api', { version: '1.0.0' });
 * logger.info({ requestId: 'abc-123' }, 'Request received');
 *  */
export function createLogger(serviceName: string, options: ServiceLoggerOptions = {}): Logger {
  const { version = '0.0.0', baseContext = {}, pinoOptions = {} } = options;
  const environment = process.env.NODE_ENV || 'development';
  const isDevelopment = environment === 'development';

  const baseConfig = isDevelopment ? developmentConfig : productionConfig;

  const context: BaseLogContext = {
    service: serviceName,
    version,
    environment,
    ...baseContext,
  };

  return pino({
    ...baseConfig,
    ...pinoOptions,
    base: context,
  });
}
