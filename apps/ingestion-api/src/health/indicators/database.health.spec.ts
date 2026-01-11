import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseHealthIndicator } from './database.health';
import { HealthIndicatorService } from '@nestjs/terminus';
import { DATABASE_CONNECTION, type DatabaseConnection } from 'src/database';

describe('DatabaseHealthIndicator', () => {
  let indicator: DatabaseHealthIndicator;
  let mockDb: jest.Mocked<DatabaseConnection>;
  let mockHealthIndicatorService: jest.Mocked<HealthIndicatorService>;
  let mockExecute: jest.Mock;
  let mockCheck: jest.Mock;

  beforeEach(async () => {
    mockExecute = jest.fn();
    mockCheck = jest.fn().mockReturnValue({
      up: jest.fn().mockReturnValue({ database: { status: 'up' } }),
    });

    mockDb = {
      execute: mockExecute,
    } as unknown as jest.Mocked<DatabaseConnection>;

    mockHealthIndicatorService = {
      check: mockCheck,
    } as unknown as jest.Mocked<HealthIndicatorService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DatabaseHealthIndicator,
        {
          provide: DATABASE_CONNECTION,
          useValue: mockDb,
        },
        {
          provide: HealthIndicatorService,
          useValue: mockHealthIndicatorService,
        },
      ],
    }).compile();

    indicator = module.get<DatabaseHealthIndicator>(DatabaseHealthIndicator);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(indicator).toBeDefined();
  });

  describe('isHealth', () => {
    it('should return up when database is healthy (SELECT 1 succeeds)', async () => {
      const key = 'database';
      mockExecute.mockResolvedValue([]);

      const result = await indicator.isHealth(key);

      expect(mockExecute).toHaveBeenCalledWith('SELECT 1');
      expect(mockCheck).toHaveBeenCalledWith(key);
      expect(result).toEqual({ database: { status: 'up' } });
    });

    it('should return down when database query fails', async () => {
      const key = 'database';
      const dbError = new Error('Connection refused');
      mockExecute.mockRejectedValue(dbError);

      await expect(indicator.isHealth(key)).rejects.toThrow(
        'Connection refused',
      );
    });

    it('should use the provided key in health check', async () => {
      const customKey = 'postgres';
      mockExecute.mockResolvedValue([]);

      await indicator.isHealth(customKey);

      expect(mockCheck).toHaveBeenCalledWith(customKey);
    });
  });
});
