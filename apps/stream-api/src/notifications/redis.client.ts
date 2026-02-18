import Redis from 'ioredis';

/** Redis connection configuration derived from environment variables. */
export interface RedisConfig {
  host: string;
  port: number;
}

/**
 * Returns Redis connection config from environment variables.
 * Used by BullMQ Queue/Worker constructors (they manage their own connections).
 */
export function getRedisConfig(): RedisConfig {
  return {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
  };
}

/**
 * Singleton Redis client for direct commands (status CRUD).
 * `maxRetriesPerRequest: null` is required by BullMQ when sharing config.
 */
export const redis = new Redis({
  ...getRedisConfig(),
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
});

/**
 * Gracefully disconnects the Redis client.
 * Call on SIGTERM/SIGINT in server.ts.
 */
export async function disconnectRedis(): Promise<void> {
  await redis.quit();
}
