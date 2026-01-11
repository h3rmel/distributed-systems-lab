import { Test, TestingModule } from '@nestjs/testing';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { IngestResponseDto } from '@distributed-systems-lab/dto';
import { createTestWebhookDto } from 'test/utils/test-helpers';

describe('WebhookController', () => {
  let controller: WebhookController;
  let service: WebhookService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WebhookController],
      providers: [
        {
          provide: WebhookService,
          useValue: {
            enqueue: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<WebhookController>(WebhookController);
    service = module.get<WebhookService>(WebhookService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('ingest', () => {
    it('should call service.enqueue() with correct parameters', async () => {
      const provider = 'stripe';
      const dto = createTestWebhookDto();
      const expectedResponse: IngestResponseDto = {
        accepted: true,
        jobId: 'job-123',
      };

      const enqueueSpy = jest
        .spyOn(service, 'enqueue')
        .mockResolvedValue(expectedResponse);

      const result = await controller.ingest(provider, dto);

      expect(enqueueSpy).toHaveBeenCalledTimes(1);
      expect(enqueueSpy).toHaveBeenCalledWith(provider, dto);
      expect(result).toEqual(expectedResponse);
    });

    it('should return 202 Accepted with IngestResponseDto', async () => {
      const provider = 'paypal';
      const dto = createTestWebhookDto();
      const expectedResponse: IngestResponseDto = {
        accepted: true,
        jobId: 'job-456',
      };

      jest.spyOn(service, 'enqueue').mockResolvedValue(expectedResponse);

      const result = await controller.ingest(provider, dto);

      expect(result).toEqual(expectedResponse);
      expect(result.accepted).toBe(true);
      expect(result.jobId).toBeDefined();
    });

    it('should propagate service errors (validation handled by ValidationPipe)', async () => {
      const provider = 'stripe';
      const dto = createTestWebhookDto();
      const serviceError = new Error('Queue unavailable');

      jest.spyOn(service, 'enqueue').mockRejectedValue(serviceError);

      await expect(controller.ingest(provider, dto)).rejects.toThrow(
        'Queue unavailable',
      );
    });
  });
});
