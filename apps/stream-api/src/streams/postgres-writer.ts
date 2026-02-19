import { Pool, PoolClient } from 'pg';
import copyFrom from 'pg-copy-streams';
import { Writable } from 'node:stream';

/** Configuration for PostgreSQL connection. */
export interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

/**
 * Manages the PostgreSQL connection pool and COPY stream creation.
 * Used for high-performance bulk inserts via the Postgres COPY protocol.
 */
export class DatabaseService {
  private readonly pool: Pool;

  constructor(config: DatabaseConfig) {
    this.pool = new Pool(config);
  }

  /**
   * Creates a writable stream that uses Postgres COPY protocol
   * for high-performance bulk inserts.
   *
   * @returns Object containing the COPY stream and cleanup function to release the client
   */
  async createCopyStream(): Promise<{
    stream: Writable;
    done: () => Promise<void>;
  }> {
    const client: PoolClient = await this.pool.connect();

    const copyStream = client.query(
      copyFrom.from(
        `COPY webhook_events (provider, event_id, timestamp, data) FROM STDIN WITH (FORMAT csv)`,
      ),
    );

    const done = async (): Promise<void> => {
      client.release();
    };

    return { stream: copyStream, done };
  }

  /** Gracefully closes the connection pool. */
  async close(): Promise<void> {
    await this.pool.end();
  }
}
