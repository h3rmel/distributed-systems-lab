import { Test, TestingModule } from '@nestjs/testing';
import { IdempotencyService } from './idempotency.service';
import Redis from 'ioredis';
import { REDIS_CLIENT } from 'src/redis/redis.constants';

describe('IdempotencyService', () => {
  let service: IdempotencyService;
  let mockRedis: jest.Mocked<Redis>;
  let mockExists: jest.Mock;
  let mockSet: jest.Mock;

  beforeEach(async () => {
    mockExists = jest.fn();
    mockSet = jest.fn();

    mockRedis = {
      exists: mockExists,
      set: mockSet,
    } as unknown as jest.Mocked<Redis>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IdempotencyService,
        {
          provide: REDIS_CLIENT,
          useValue: mockRedis,
        },
      ],
    }).compile();

    service = module.get<IdempotencyService>(IdempotencyService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('isProcessed', () => {
    it('should return false for unprocessed eventId', async () => {
      const eventId = 'evt_test_001';
      mockExists.mockResolvedValue(0);

      const result = await service.isProcessed(eventId);

      expect(result).toBe(false);
      expect(mockExists).toHaveBeenCalledWith(`idempotency:webhook:${eventId}`);
    });

    it('should return true for processed eventId', async () => {
      const eventId = 'evt_test_002';
      mockExists.mockResolvedValue(1);

      const result = await service.isProcessed(eventId);

      expect(result).toBe(true);
      expect(mockExists).toHaveBeenCalledWith(`idempotency:webhook:${eventId}`);
    });

    it('should build correct Redis key format', async () => {
      const eventId = 'evt_custom_123';
      mockExists.mockResolvedValue(0);

      await service.isProcessed(eventId);

      expect(mockExists).toHaveBeenCalledWith(
        'idempotency:webhook:evt_custom_123',
      );
    });
  });

  describe('markProcessed', () => {
    it('should mark eventId as processed with 24h TTL', async () => {
      const eventId = 'evt_test_003';
      const expectedTtl = 60 * 60 * 24;
      mockSet.mockResolvedValue('OK');

      await service.markProcessed(eventId);

      expect(mockSet).toHaveBeenCalledTimes(1);
      expect(mockSet).toHaveBeenCalledWith(
        `idempotency:webhook:${eventId}`,
        '1',
        'EX',
        expectedTtl,
      );
    });

    it('should build correct Redis key format', async () => {
      const eventId = 'evt_another_456';
      mockSet.mockResolvedValue('OK');

      await service.markProcessed(eventId);

      expect(mockSet).toHaveBeenCalledWith(
        'idempotency:webhook:evt_another_456',
        '1',
        'EX',
        86400,
      );
    });
  });
});
