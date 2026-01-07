/**
 * Shared database package for Distributed Systems Lab
 *
 * Provides:
 * - Drizzle ORM client with connection pooling
 * - PostgreSQL schema definitions
 * - Type-safe database operations
 *
 * @packageDocumentation
 */

// Export database client
export { db, sql } from './client';

// Export schema tables
export { webhookEvents } from './schema';

// Re-export Drizzle types for convenience
export type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
