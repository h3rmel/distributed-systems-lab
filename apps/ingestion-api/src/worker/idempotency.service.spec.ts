import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { IdempotencyService } from './idempotency.service';
import Redis from 'ioredis';

// Mock ioredis
jest.mock('ioredis');

describe('IdempotencyService', () => {
  let service: IdempotencyService;
  let mockRedis: jest.Mocked<Redis>;
  let mockConfigService: jest.Mocked<ConfigService>;
  let mockExists: jest.Mock;
  let mockSet: jest.Mock;
  let mockQuit: jest.Mock;

  beforeEach(async () => {
    mockExists = jest.fn();
    mockSet = jest.fn();
    mockQuit = jest.fn();

    mockRedis = {
      exists: mockExists,
      set: mockSet,
      quit: mockQuit,
    } as unknown as jest.Mocked<Redis>;

    mockConfigService = {
      get: jest.fn(),
    } as unknown as jest.Mocked<ConfigService>;

    // Mock Redis constructor
    (Redis as unknown as jest.Mock).mockImplementation(() => mockRedis);

    // Setup default config values
    mockConfigService.get.mockImplementation(function (
      this: void,
      key: string,
      defaultValue?: unknown,
    ): unknown {
      if (key === 'REDIS_HOST') return 'localhost';
      if (key === 'REDIS_PORT') return 6379;
      return defaultValue;
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IdempotencyService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
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
      const expectedTtl = 60 * 60 * 24; // 24 hours in seconds
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

  describe('onModuleDestroy', () => {
    it('should close Redis connection on module destroy', async () => {
      mockQuit.mockResolvedValue('OK');

      await service.onModuleDestroy();

      expect(mockQuit).toHaveBeenCalledTimes(1);
    });
  });
});
