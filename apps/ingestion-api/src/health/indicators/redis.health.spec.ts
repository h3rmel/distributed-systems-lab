import { Test, TestingModule } from '@nestjs/testing';
import { RedisHealthIndicator } from './redis.health';
import { HealthIndicatorService } from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

// Mock ioredis
jest.mock('ioredis');

describe('RedisHealthIndicator', () => {
  let indicator: RedisHealthIndicator;
  let mockRedis: jest.Mocked<Redis>;
  let mockHealthIndicatorService: jest.Mocked<HealthIndicatorService>;
  let mockConfigService: jest.Mocked<ConfigService>;
  let mockPing: jest.Mock;
  let mockQuit: jest.Mock;
  let mockCheck: jest.Mock;

  beforeEach(async () => {
    mockPing = jest.fn();
    mockQuit = jest.fn();
    mockCheck = jest.fn().mockReturnValue({
      up: jest.fn().mockReturnValue({ redis: { status: 'up' } }),
      down: jest.fn().mockReturnValue({ redis: { status: 'down' } }),
    });

    mockRedis = {
      ping: mockPing,
      quit: mockQuit,
    } as unknown as jest.Mocked<Redis>;

    mockHealthIndicatorService = {
      check: mockCheck,
    } as unknown as jest.Mocked<HealthIndicatorService>;

    mockConfigService = {
      get: jest.fn(),
    } as unknown as jest.Mocked<ConfigService>;

    // Mock Redis constructor
    (Redis as unknown as jest.Mock).mockImplementation(() => mockRedis);

    // Setup default config values
    mockConfigService.get.mockImplementation(
      (key: string, defaultValue?: unknown) => {
        if (key === 'REDIS_HOST') return 'localhost';
        if (key === 'REDIS_PORT') return 6379;
        return defaultValue;
      },
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisHealthIndicator,
        {
          provide: HealthIndicatorService,
          useValue: mockHealthIndicatorService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    indicator = module.get<RedisHealthIndicator>(RedisHealthIndicator);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(indicator).toBeDefined();
  });

  describe('isHealthy', () => {
    it('should return up when Redis PING returns PONG', async () => {
      const key = 'redis';
      mockPing.mockResolvedValue('PONG');

      const result = await indicator.isHealthy(key);

      expect(mockPing).toHaveBeenCalledTimes(1);
      expect(mockCheck).toHaveBeenCalledWith(key);
      expect(result).toEqual({ redis: { status: 'up' } });
    });

    it('should return down when Redis PING fails', async () => {
      const key = 'redis';
      mockPing.mockResolvedValue('FAILED');

      const result = await indicator.isHealthy(key);

      expect(mockPing).toHaveBeenCalledTimes(1);
      expect(mockCheck).toHaveBeenCalledWith(key);
      expect(result).toEqual({ redis: { status: 'down' } });
    });

    it('should return down when Redis PING throws error', async () => {
      const key = 'redis';
      const redisError = new Error('Connection timeout');
      mockPing.mockRejectedValue(redisError);

      await expect(indicator.isHealthy(key)).rejects.toThrow(
        'Connection timeout',
      );
    });

    it('should use the provided key in health check', async () => {
      const customKey = 'cache';
      mockPing.mockResolvedValue('PONG');

      await indicator.isHealthy(customKey);

      expect(mockCheck).toHaveBeenCalledWith(customKey);
    });
  });

  describe('onModuleDestroy', () => {
    it('should close Redis connection on module destroy', async () => {
      mockQuit.mockResolvedValue('OK');

      await indicator.onModuleDestroy();

      expect(mockQuit).toHaveBeenCalledTimes(1);
    });
  });
});
