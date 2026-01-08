import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import {
  WebhookJobData,
  IngestResponseDto,
} from '@distributed-systems-lab/dto';
import { QUEUE_NAMES } from 'src/shared/constants/queue.constants';
import { CreateWebhookDto } from './dto';

@Injectable()
export class WebhookService {
  constructor(
    @InjectQueue(QUEUE_NAMES.WEBHOOKS)
    private readonly webhookQueue: Queue<WebhookJobData>,
  ) {}

  /**
   * Enqueues a webhook event for background processing.
   *
   * @param provider - Webhook provider identifier (e.g., 'stripe', 'paypal')
   * @param dto - Validated webhook payload
   * @returns Job metadata with unique job ID
   */
  async enqueue(
    provider: string,
    dto: CreateWebhookDto,
  ): Promise<IngestResponseDto> {
    const jobData: WebhookJobData = {
      provider,
      eventId: dto.eventId,
      timestamp: dto.timestamp,
      data: dto.data,
    };

    const job = await this.webhookQueue.add('ingest', jobData, {
      jobId: dto.eventId,
    });

    return {
      accepted: true,
      jobId: job.id ?? dto.eventId,
    };
  }
}
