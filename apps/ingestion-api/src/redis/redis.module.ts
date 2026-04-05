import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';
import { redisConnectionFromConfig } from './redis-connection';
import { RedisShutdownHook } from './redis-shutdown.hook';

/**
 * Single ioredis instance for app-owned Redis usage (idempotency keys, health ping).
 * BullMQ uses its own connections; sharing a subscriber connection with BullMQ is unsupported.
 */
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Redis => {
        const { host, port } = redisConnectionFromConfig(config);
        return new Redis({
          host,
          port,
          lazyConnect: true,
        });
      },
    },
    RedisShutdownHook,
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
