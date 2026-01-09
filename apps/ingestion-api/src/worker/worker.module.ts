import { Module } from '@nestjs/common';
import { QueueModule } from 'src/queue';
import { IdempotencyService } from './idempotency.service';
import { WebhookProcessor } from './webhook.processor';

@Module({
  imports: [QueueModule],
  providers: [IdempotencyService, WebhookProcessor],
})
export class WorkerModule {}
