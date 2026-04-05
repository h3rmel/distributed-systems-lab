import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';
import { DATABASE_CONNECTION, type DatabaseConnection } from './database';

describe('AppService', () => {
  let service: AppService;
  let mockDb: jest.Mocked<DatabaseConnection>;

  beforeEach(async () => {
    mockDb = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<DatabaseConnection>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppService,
        {
          provide: DATABASE_CONNECTION,
          useValue: mockDb,
        },
      ],
    }).compile();

    service = module.get<AppService>(AppService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getHello', () => {
    it('should return getHello() response', async () => {
      const mockResult = [{ test: 1 }];
      mockDb.execute.mockResolvedValue(mockResult as never);

      const result = await service.getHello();

      expect(mockDb.execute).toHaveBeenCalledWith('SELECT 1 as test');
      expect(result).toBe(
        `Database connected! Result: ${JSON.stringify(mockResult)}`,
      );
    });

    it('should handle database query results correctly', async () => {
      const mockResult = [{ test: 42 }];
      mockDb.execute.mockResolvedValue(mockResult as never);

      const result = await service.getHello();

      expect(result).toContain('Database connected!');
      expect(result).toContain(JSON.stringify(mockResult));
    });
  });
});
