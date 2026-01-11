import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import {
  HealthCheckService,
  HealthCheckStatus,
  HealthIndicatorStatus,
  MemoryHealthIndicator,
} from '@nestjs/terminus';
import { DatabaseHealthIndicator } from './indicators/database.health';
import { RedisHealthIndicator } from './indicators/redis.health';

describe('HealthController', () => {
  let controller: HealthController;
  let healthCheckService: jest.Mocked<HealthCheckService>;
  let databaseIndicator: jest.Mocked<DatabaseHealthIndicator>;
  let redisIndicator: jest.Mocked<RedisHealthIndicator>;
  let memoryIndicator: jest.Mocked<MemoryHealthIndicator>;

  beforeEach(async () => {
    healthCheckService = {
      check: jest.fn(),
    } as unknown as jest.Mocked<HealthCheckService>;

    databaseIndicator = {
      isHealth: jest.fn(),
    } as unknown as jest.Mocked<DatabaseHealthIndicator>;

    redisIndicator = {
      isHealthy: jest.fn(),
    } as unknown as jest.Mocked<RedisHealthIndicator>;

    memoryIndicator = {
      checkHeap: jest.fn(),
    } as unknown as jest.Mocked<MemoryHealthIndicator>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthCheckService,
          useValue: healthCheckService,
        },
        {
          provide: DatabaseHealthIndicator,
          useValue: databaseIndicator,
        },
        {
          provide: RedisHealthIndicator,
          useValue: redisIndicator,
        },
        {
          provide: MemoryHealthIndicator,
          useValue: memoryIndicator,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('check', () => {
    it('should call all health indicators', async () => {
      const mockHealthResult = {
        status: 'ok' as HealthCheckStatus,
        info: {
          database: { status: 'up' as HealthIndicatorStatus },
          redis: { status: 'up' as HealthIndicatorStatus },
          memory_heap: { status: 'up' as HealthIndicatorStatus },
        },
        details: {
          database: { status: 'up' as HealthIndicatorStatus },
          redis: { status: 'up' as HealthIndicatorStatus },
          memory_heap: { status: 'up' as HealthIndicatorStatus },
        },
      };

      databaseIndicator.isHealth.mockResolvedValue({
        database: { status: 'up' },
      });
      redisIndicator.isHealthy.mockResolvedValue({
        redis: { status: 'up' },
      });
      memoryIndicator.checkHeap.mockResolvedValue({
        memory_heap: { status: 'up' },
      });
      const checkSpy = jest.spyOn(healthCheckService, 'check');
      checkSpy.mockResolvedValue(mockHealthResult);

      const result = await controller.check();

      expect(checkSpy).toHaveBeenCalledTimes(1);
      expect(checkSpy).toHaveBeenCalledWith([
        expect.any(Function),
        expect.any(Function),
        expect.any(Function),
      ]);
      expect(result).toEqual(mockHealthResult);
    });

    it('should return health check result', async () => {
      const mockHealthResult = {
        status: 'ok' as HealthCheckStatus,
        info: {
          database: { status: 'up' as HealthIndicatorStatus },
          redis: { status: 'up' as HealthIndicatorStatus },
          memory_heap: { status: 'up' as HealthIndicatorStatus },
        },
        details: {
          database: { status: 'up' as HealthIndicatorStatus },
          redis: { status: 'up' as HealthIndicatorStatus },
          memory_heap: { status: 'up' as HealthIndicatorStatus },
        },
      };

      databaseIndicator.isHealth.mockResolvedValue({
        database: { status: 'up' },
      });
      redisIndicator.isHealthy.mockResolvedValue({
        redis: { status: 'up' },
      });
      memoryIndicator.checkHeap.mockResolvedValue({
        memory_heap: { status: 'up' },
      });
      healthCheckService.check.mockResolvedValue(mockHealthResult);

      const result = await controller.check();

      expect(result).toEqual(mockHealthResult);
    });

    it('should handle health check failures', async () => {
      const mockHealthResult = {
        status: 'error' as HealthCheckStatus,
        error: {
          database: {
            status: 'down' as HealthIndicatorStatus,
            message: 'Connection failed',
          },
        },
        details: {
          database: {
            status: 'down' as HealthIndicatorStatus,
            message: 'Connection failed',
          },
        },
      };

      databaseIndicator.isHealth.mockRejectedValue(
        new Error('Connection failed'),
      );

      healthCheckService.check.mockResolvedValue(mockHealthResult);

      const result = await controller.check();

      expect(result.status).toBe('error');
    });
  });
});
