import { ConfigService } from '@nestjs/config';

/**
 * Redis host/port from Nest config (env). Used by BullMQ root config and the shared ioredis client.
 */
export function redisConnectionFromConfig(config: ConfigService): {
  host: string;
  port: number;
} {
  return {
    host: config.get<string>('REDIS_HOST', 'localhost'),
    port: config.get<number>('REDIS_PORT', 6379),
  };
}
