import type { LoggerOptions } from 'pino';

/**
 * Base context fields included in every log entry
 */
export interface BaseLogContext {
  /** Service name (e.g., 'ingestion-api', 'stream-engine') */
  service: string;
  /** Application version from package.json */
  version?: string;
  /** Environment (development, production, test) */
  environment: string;
}

/**
 * Additional context that can be added to individual log entries
 */
export interface LogContext extends Record<string, unknown> {
  /** Correlation ID for request tracing across services */
  correlationId?: string;
  /** Request ID for tracking within a single service */
  requestId?: string;
  /** User ID if authenticated */
  userId?: string;
  /** Duration in milliseconds for timing operations */
  durationMs?: number;
}

/**
 * Options for creating a service-specific logger
 */
export interface ServiceLoggerOptions {
  /** Application version (defaults to '0.0.0') */
  version?: string;
  /** Additional base context to include in all logs */
  baseContext?: Record<string, unknown>;
  /** Override default pino options */
  pinoOptions?: Partial<LoggerOptions>;
}
