import { Test, TestingModule } from '@nestjs/testing';
import { MetricsGateway } from './metrics.gateway';
import { JobCompletedEvent, SocketEvents } from '@distributed-systems-lab/dto';
import { Server } from 'socket.io';

describe('MetricsGateway', () => {
  let gateway: MetricsGateway;
  let mockServer: {
    emit: jest.Mock;
  };

  beforeEach(async () => {
    mockServer = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [MetricsGateway],
    }).compile();

    gateway = module.get<MetricsGateway>(MetricsGateway);
    gateway.server = mockServer as unknown as Server;
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('emitJobCompleted', () => {
    it('should emit job-completed event with correct payload', () => {
      const event: JobCompletedEvent = {
        jobId: 'job-123',
        eventId: 'evt_test_001',
        provider: 'stripe',
        processingTime: 45,
        timestamp: '2026-01-10T16:00:00.000Z',
      };

      gateway.emitJobCompleted(event);

      expect(mockServer.emit).toHaveBeenCalledTimes(1);
      expect(mockServer.emit).toHaveBeenCalledWith(
        SocketEvents.JOB_COMPLETED,
        event,
      );
    });

    it('should emit to all connected clients', () => {
      const event: JobCompletedEvent = {
        jobId: 'job-456',
        eventId: 'evt_test_002',
        provider: 'paypal',
        processingTime: 32,
        timestamp: '2026-01-10T16:01:00.000Z',
      };

      gateway.emitJobCompleted(event);

      // server.emit() broadcasts to all clients (no room specified)
      expect(mockServer.emit).toHaveBeenCalledWith(
        SocketEvents.JOB_COMPLETED,
        event,
      );
    });
  });
});
