import { Test, TestingModule } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import { WebhookProcessor } from './webhook.processor';
import { IdempotencyService } from './idempotency.service';
import { MetricsGateway } from 'src/metrics/metrics.gateway';
import { DATABASE_CONNECTION, type DatabaseConnection } from 'src/database';
import { Job } from 'bullmq';
import {
  JobCompletedEvent,
  WebhookJobData,
} from '@distributed-systems-lab/dto';
import { webhookEvents } from '@distributed-systems-lab/database';
import { createTestJobData } from 'test/utils/test-helpers';

describe('WebhookProcessor', () => {
  let processor: WebhookProcessor;
  let mockDb: jest.Mocked<DatabaseConnection>;
  let mockIdempotencyService: jest.Mocked<IdempotencyService>;
  let mockMetricsGateway: jest.Mocked<MetricsGateway>;
  let mockLogger: jest.Mocked<PinoLogger>;
  let mockIsProcessed: jest.Mock;
  let mockMarkProcessed: jest.Mock;
  let mockInsert: jest.Mock;
  let mockEmitJobCompleted: jest.Mock;
  let mockLoggerInfo: jest.Mock;
  let mockLoggerWarn: jest.Mock;
  let mockLoggerDebug: jest.Mock;

  beforeEach(async () => {
    mockIsProcessed = jest.fn();
    mockMarkProcessed = jest.fn();
    mockInsert = jest.fn();
    mockEmitJobCompleted = jest.fn();
    mockLoggerInfo = jest.fn();
    mockLoggerWarn = jest.fn();
    mockLoggerDebug = jest.fn();

    mockDb = {
      insert: mockInsert,
    } as unknown as jest.Mocked<DatabaseConnection>;

    mockIdempotencyService = {
      isProcessed: mockIsProcessed,
      markProcessed: mockMarkProcessed,
    } as unknown as jest.Mocked<IdempotencyService>;

    mockMetricsGateway = {
      emitJobCompleted: mockEmitJobCompleted,
    } as unknown as jest.Mocked<MetricsGateway>;

    mockLogger = {
      info: mockLoggerInfo,
      warn: mockLoggerWarn,
      debug: mockLoggerDebug,
    } as unknown as jest.Mocked<PinoLogger>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhookProcessor,
        {
          provide: DATABASE_CONNECTION,
          useValue: mockDb,
        },
        {
          provide: IdempotencyService,
          useValue: mockIdempotencyService,
        },
        {
          provide: MetricsGateway,
          useValue: mockMetricsGateway,
        },
        {
          provide: `PinoLogger:${WebhookProcessor.name}`,
          useValue: mockLogger,
        },
      ],
    }).compile();

    processor = module.get<WebhookProcessor>(WebhookProcessor);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  describe('process', () => {
    const createMockJob = (
      data: WebhookJobData,
      processedOn?: number,
    ): Job<WebhookJobData> => {
      return {
        id: 'job-123',
        data,
        processedOn: processedOn ?? Date.now(),
      } as Job<WebhookJobData>;
    };

    it('should skip processing if eventId already processed', async () => {
      const jobData = createTestJobData({ eventId: 'evt_duplicate_001' });
      const job = createMockJob(jobData);

      mockIsProcessed.mockResolvedValue(true);

      await processor.process(job);

      expect(mockIsProcessed).toHaveBeenCalledWith(jobData.eventId);
      expect(mockInsert).not.toHaveBeenCalled();
      expect(mockMarkProcessed).not.toHaveBeenCalled();
      expect(mockEmitJobCompleted).not.toHaveBeenCalled();
      expect(mockLoggerWarn).toHaveBeenCalledWith(
        { eventId: jobData.eventId, provider: jobData.provider },
        'Duplicate event skipped',
      );
    });

    it('should insert webhook event to database', async () => {
      const jobData = createTestJobData();
      const job = createMockJob(jobData);
      const mockInsertBuilder = {
        values: jest.fn().mockResolvedValue(undefined),
      };

      mockIsProcessed.mockResolvedValue(false);
      mockInsert.mockReturnValue(mockInsertBuilder);

      await processor.process(job);

      expect(mockInsert).toHaveBeenCalledWith(webhookEvents);
      expect(mockInsertBuilder.values).toHaveBeenCalledWith({
        provider: jobData.provider,
        eventId: jobData.eventId,
        timestamp: new Date(jobData.timestamp),
        data: jobData.data,
      });
    });

    it('should mark eventId as processed after insert', async () => {
      const jobData = createTestJobData();
      const job = createMockJob(jobData);
      const mockInsertBuilder = {
        values: jest.fn().mockResolvedValue(undefined),
      };

      mockIsProcessed.mockResolvedValue(false);
      mockInsert.mockReturnValue(mockInsertBuilder);

      await processor.process(job);

      expect(mockMarkProcessed).toHaveBeenCalledWith(jobData.eventId);
      // Verify both insert and markProcessed were called
      expect(mockInsert).toHaveBeenCalled();
      expect(mockMarkProcessed).toHaveBeenCalled();
    });

    it('should emit job-completed event via MetricsGateway', async () => {
      const jobData = createTestJobData({
        eventId: 'evt_emit_001',
        provider: 'stripe',
      });
      const processedOn = Date.now() - 50; // 50ms ago
      const job = createMockJob(jobData, processedOn);
      const mockInsertBuilder = {
        values: jest.fn().mockResolvedValue(undefined),
      };

      mockIsProcessed.mockResolvedValue(false);
      mockInsert.mockReturnValue(mockInsertBuilder);

      await processor.process(job);

      expect(mockEmitJobCompleted).toHaveBeenCalledTimes(1);
      const emittedEvent = (
        mockEmitJobCompleted.mock.calls[0] as [JobCompletedEvent]
      )[0];
      expect(emittedEvent.eventId).toBe(jobData.eventId);
      expect(emittedEvent.provider).toBe(jobData.provider);
      expect(emittedEvent.jobId).toBe(job.id);
      expect(emittedEvent.processingTime).toBeGreaterThanOrEqual(0);
      expect(emittedEvent.timestamp).toBeDefined();
    });

    it('should calculate processing time correctly', async () => {
      const jobData = createTestJobData();
      const processedOn = Date.now() - 100; // 100ms ago
      const job = createMockJob(jobData, processedOn);
      const mockInsertBuilder = {
        values: jest.fn().mockResolvedValue(undefined),
      };

      mockIsProcessed.mockResolvedValue(false);
      mockInsert.mockReturnValue(mockInsertBuilder);

      await processor.process(job);

      const emittedEvent = (
        mockEmitJobCompleted.mock.calls[0] as [JobCompletedEvent]
      )[0];
      expect(emittedEvent.processingTime).toBeGreaterThanOrEqual(100);
    });

    it('should log appropriate messages at each stage', async () => {
      const jobData = createTestJobData();
      const job = createMockJob(jobData);
      const mockInsertBuilder = {
        values: jest.fn().mockResolvedValue(undefined),
      };

      mockIsProcessed.mockResolvedValue(false);
      mockInsert.mockReturnValue(mockInsertBuilder);

      await processor.process(job);

      expect(mockLoggerInfo).toHaveBeenCalledWith('Processing webhook', {
        eventId: jobData.eventId,
        provider: jobData.provider,
        timestamp: jobData.timestamp,
        data: jobData.data,
      });
      expect(mockLoggerDebug).toHaveBeenCalledWith(
        'WebSocket event emitted',
        expect.objectContaining({
          event: 'job-completed',
          eventId: jobData.eventId,
          provider: jobData.provider,
        }),
      );
      expect(mockLoggerInfo).toHaveBeenCalledWith(
        'Webhook processed',
        expect.objectContaining({
          eventId: jobData.eventId,
          provider: jobData.provider,
          jobId: job.id,
        }),
      );
    });

    it('should handle database errors gracefully', async () => {
      const jobData = createTestJobData();
      const job = createMockJob(jobData);
      const dbError = new Error('Database connection failed');
      const mockInsertBuilder = {
        values: jest.fn().mockRejectedValue(dbError),
      };

      mockIsProcessed.mockResolvedValue(false);
      mockInsert.mockReturnValue(mockInsertBuilder);

      await expect(processor.process(job)).rejects.toThrow(
        'Database connection failed',
      );
      expect(mockMarkProcessed).not.toHaveBeenCalled();
      expect(mockEmitJobCompleted).not.toHaveBeenCalled();
    });
  });
});
