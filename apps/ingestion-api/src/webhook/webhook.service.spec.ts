import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { WebhookService } from './webhook.service';
import { CreateWebhookDto } from './dto';
import { QUEUE_NAMES } from 'src/shared/constants/queue.constants';
import { Queue } from 'bullmq';
import { WebhookJobData } from '@distributed-systems-lab/dto';
import { createTestWebhookDto } from 'test/utils/test-helpers';

describe('WebhookService', () => {
  let service: WebhookService;
  let mockQueue: jest.Mocked<Queue<WebhookJobData>>;

  beforeEach(async () => {
    mockQueue = {
      add: jest.fn(),
    } as unknown as jest.Mocked<Queue<WebhookJobData>>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhookService,
        {
          provide: getQueueToken(QUEUE_NAMES.WEBHOOKS),
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get<WebhookService>(WebhookService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('enqueue', () => {
    it('should enqueue job with correct WebhookJobData', async () => {
      const provider = 'stripe';
      const dto = createTestWebhookDto();
      const expectedJobId = 'job-123';

      mockQueue.add.mockResolvedValue({
        id: expectedJobId,
        name: 'ingest',
        data: {} as WebhookJobData,
      } as Awaited<ReturnType<Queue<WebhookJobData>['add']>>);

      await service.enqueue(provider, dto);

      expect(mockQueue.add).toHaveBeenCalledTimes(1);
      expect(mockQueue.add).toHaveBeenCalledWith(
        'ingest',
        {
          provider,
          eventId: dto.eventId,
          timestamp: dto.timestamp,
          data: dto.data,
        },
        {
          jobId: dto.eventId,
        },
      );
    });

    it('should use eventId as jobId', async () => {
      const provider = 'paypal';
      const dto = createTestWebhookDto({ eventId: 'evt_unique_123' });
      const expectedJobId = 'evt_unique_123';

      mockQueue.add.mockResolvedValue({
        id: expectedJobId,
        name: 'ingest',
        data: {} as WebhookJobData,
      } as Awaited<ReturnType<Queue<WebhookJobData>['add']>>);

      await service.enqueue(provider, dto);

      expect(mockQueue.add).toHaveBeenCalledWith('ingest', expect.any(Object), {
        jobId: dto.eventId,
      });
    });

    it('should return accepted: true with jobId', async () => {
      const provider = 'stripe';
      const dto = createTestWebhookDto();
      const expectedJobId = 'job-456';

      mockQueue.add.mockResolvedValue({
        id: expectedJobId,
        name: 'ingest',
        data: {} as WebhookJobData,
      } as Awaited<ReturnType<Queue<WebhookJobData>['add']>>);

      const result = await service.enqueue(provider, dto);

      expect(result).toEqual({
        accepted: true,
        jobId: expectedJobId,
      });
    });

    it('should return eventId as jobId if queue returns undefined id', async () => {
      const provider = 'stripe';
      const dto = createTestWebhookDto({ eventId: 'evt_fallback_123' });

      mockQueue.add.mockResolvedValue({
        id: undefined,
        name: 'ingest',
        data: {} as WebhookJobData,
      } as Awaited<ReturnType<Queue<WebhookJobData>['add']>>);

      const result = await service.enqueue(provider, dto);

      expect(result).toEqual({
        accepted: true,
        jobId: dto.eventId,
      });
    });

    it('should handle queue errors gracefully', async () => {
      const provider = 'stripe';
      const dto = createTestWebhookDto();
      const queueError = new Error('Queue connection failed');

      mockQueue.add.mockRejectedValue(queueError);

      await expect(service.enqueue(provider, dto)).rejects.toThrow(
        'Queue connection failed',
      );
    });
  });
});
