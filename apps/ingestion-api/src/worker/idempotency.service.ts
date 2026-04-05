import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from 'src/redis/redis.constants';

@Injectable()
export class IdempotencyService {
  private readonly ttlSeconds = 60 * 60 * 24; // 24 hours

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

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
}
