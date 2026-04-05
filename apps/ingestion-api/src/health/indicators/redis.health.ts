import { Inject, Injectable } from '@nestjs/common';
import {
  HealthIndicatorResult,
  HealthIndicatorService,
} from '@nestjs/terminus';
import Redis from 'ioredis';
import { REDIS_CLIENT } from 'src/redis/redis.constants';

@Injectable()
export class RedisHealthIndicator {
  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
    @Inject(REDIS_CLIENT) private readonly client: Redis,
  ) {}

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const result = await this.client.ping();

    const isUp = result === 'PONG';

    return isUp
      ? this.healthIndicatorService.check(key).up()
      : this.healthIndicatorService.check(key).down();
  }
}
