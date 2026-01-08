import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { CreateWebhookDto } from './dto';
import { IngestResponseDto } from '@distributed-systems-lab/dto';

@Controller('webhooks')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post(':provider')
  @HttpCode(HttpStatus.ACCEPTED)
  async ingest(
    @Param('provider') provider: string,
    @Body() dto: CreateWebhookDto,
  ): Promise<IngestResponseDto> {
    return this.webhookService.enqueue(provider, dto);
  }
}
