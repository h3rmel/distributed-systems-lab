import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

/**
 * PostgreSQL connection configuration
 * Uses environment variables with sensible defaults
 */
const connectionString = `postgresql://${process.env.DB_USER || 'dev_user'}:${process.env.DB_PASSWORD || 'dev_password'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}/${process.env.DB_NAME || 'distributed_lab'}`;

/**
 * PostgreSQL client instance
 * Supports connection pooling and prepared statements
 */
export const sql = postgres(connectionString, {
  max: 10, // Maximum number of connections in pool
  idle_timeout: 20, // Close idle connections after 20 seconds
  connect_timeout: 10, // Connection timeout in seconds
});

/**
 * Drizzle ORM database instance
 * Provides type-safe database operations based on schema
 *
 * @example
 * import { db } from '@distributed-systems-lab/database';
 * const events = await db.select().from(webhookEvents).limit(10);
 */
export const db = drizzle(sql, { schema });
