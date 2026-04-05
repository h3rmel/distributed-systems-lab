import { Module } from '@nestjs/common';
import { QueueModule } from 'src/queue';
import { RedisModule } from 'src/redis';
import { MetricsModule } from 'src/metrics';
import { IdempotencyService } from './idempotency.service';
import { WebhookProcessor } from './webhook.processor';

@Module({
  imports: [QueueModule, RedisModule, MetricsModule],
  providers: [IdempotencyService, WebhookProcessor],
})
export class WorkerModule {}
