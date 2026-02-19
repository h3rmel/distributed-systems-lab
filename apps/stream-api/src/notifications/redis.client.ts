import Redis from 'ioredis';

/** Redis connection configuration derived from environment variables. */
export interface RedisConfig {
  host: string;
  port: number;
}

/**
 * Manages a Redis connection for direct commands (status CRUD).
 * Injected into StatusService. BullMQ Queue/Worker use raw config instead.
 */
export class RedisClient {
  private instance: Redis;

  constructor(config: RedisConfig) {
    this.instance = new Redis({
      ...config,
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
    });
  }

  /** Gracefully disconnects the Redis client. */
  async close(): Promise<void> {
    await this.instance.quit();
  }
}
