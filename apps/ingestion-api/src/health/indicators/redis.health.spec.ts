import { Test, TestingModule } from '@nestjs/testing';
import { RedisHealthIndicator } from './redis.health';
import { HealthIndicatorService } from '@nestjs/terminus';
import Redis from 'ioredis';
import { REDIS_CLIENT } from 'src/redis/redis.constants';

describe('RedisHealthIndicator', () => {
  let indicator: RedisHealthIndicator;
  let mockRedis: jest.Mocked<Redis>;
  let mockHealthIndicatorService: jest.Mocked<HealthIndicatorService>;
  let mockPing: jest.Mock;
  let mockCheck: jest.Mock;

  beforeEach(async () => {
    mockPing = jest.fn();
    mockCheck = jest.fn().mockReturnValue({
      up: jest.fn().mockReturnValue({ redis: { status: 'up' } }),
      down: jest.fn().mockReturnValue({ redis: { status: 'down' } }),
    });

    mockRedis = {
      ping: mockPing,
    } as unknown as jest.Mocked<Redis>;

    mockHealthIndicatorService = {
      check: mockCheck,
    } as unknown as jest.Mocked<HealthIndicatorService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisHealthIndicator,
        {
          provide: HealthIndicatorService,
          useValue: mockHealthIndicatorService,
        },
        {
          provide: REDIS_CLIENT,
          useValue: mockRedis,
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
});
