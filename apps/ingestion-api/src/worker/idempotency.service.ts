import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class IdempotencyService implements OnModuleDestroy {
  private readonly redis: Redis;
  private readonly ttlSeconds = 60 * 60 * 24; // 24 hours

  constructor(private readonly config: ConfigService) {
    this.redis = new Redis({
      host: this.config.get<string>('REDIS_HOST', 'localhost'),
      port: this.config.get<number>('REDIS_PORT', 6379),
    });
  }

  async isProcessed(eventId: string): Promise<boolean> {
    const key = this.buildKey(eventId);

    const exists = await this.redis.exists(key);

    return exists === 1;
  }

  async markProcessed(eventId: string): Promise<void> {
    const key = this.buildKey(eventId);

    await this.redis.set(key, '1', 'EX', this.ttlSeconds);
  }

  private buildKey(eventId: string): string {
    return `idempotency:webhook:${eventId}`;
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }
}
