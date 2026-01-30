import { Pool, PoolClient } from 'pg';
import copyFrom from 'pg-copy-streams';
import { Writable } from 'node:stream';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || 'dev_user',
  password: process.env.DB_PASSWORD || 'dev_password',
  database: process.env.DB_NAME || 'distributed_lab',
});

/**
 * Creates a writable stream that uses Postgres COPY protocol
 * for high-performance bulk inserts.
 *
 * @returns Object containing the COPY stream and cleanup function
 */
export async function createPostgresWriteStream(): Promise<{
  stream: Writable;
  done: () => Promise<void>;
}> {
  const client: PoolClient = await pool.connect();

  // COPY command matching webhook_events table schema
  const copyStream = client.query(
    copyFrom.from(
      `COPY webhook_events (provider, event_id, timestamp, data) FROM STDIN WITH (FORMAT csv)`
    )
  );

  // Cleanup function to release client back to pool
  const done = async (): Promise<void> => {
    client.release();
  };

  return { stream: copyStream, done };
}

/**
 * Gracefully close the connection pool.
 * Call this on application shutdown.
 */
export async function closePool(): Promise<void> {
  await pool.end();
}