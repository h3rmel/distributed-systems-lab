import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { io } from 'socket.io-client';
import { JobCompletedEvent } from '@distributed-systems-lab/dto';
import { MetricsGateway } from '../src/metrics/metrics.gateway';

interface SocketClient {
  readonly connected: boolean;
  connect(): void;
  disconnect(): void;
  on(event: 'connect', callback: () => void): void;
  on(event: 'disconnect', callback: () => void): void;
  on(event: 'job-completed', callback: (data: JobCompletedEvent) => void): void;
}

function createSocketClient(url: string): SocketClient {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  const socketInstance = io(url, {
    transports: ['websocket'],
    autoConnect: false,
  });
  return socketInstance as SocketClient;
}

/**
 * E2E tests for MetricsGateway WebSocket functionality.
 *
 * **Requirements:**
 * - Redis must be running (for BullMQ job processing)
 * - PostgreSQL must be running (for database operations)
 * - Run `pnpm docker:up` before executing these tests
 */
describe('MetricsGateway (e2e)', () => {
  let app: INestApplication<App>;
  let gateway: MetricsGateway;
  let socket: SocketClient | null = null;
  let port: number;
  let baseUrl: string;

  beforeAll(async () => {
    // Ensure test environment variables are set
    process.env.REDIS_HOST = process.env.REDIS_HOST || 'localhost';
    process.env.REDIS_PORT = process.env.REDIS_PORT || '6379';
    process.env.DB_HOST = process.env.DB_HOST || 'localhost';
    process.env.DB_PORT = process.env.DB_PORT || '5432';
    process.env.DB_USER = process.env.DB_USER || 'dev_user';
    process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'dev_password';
    process.env.DB_NAME = process.env.DB_NAME || 'distributed_lab';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Use dynamic port (0 = random available port)
    const server = (await app.listen(0)) as {
      address(): { port: number } | string | null;
    };
    const address = server.address();
    if (address && typeof address === 'object' && 'port' in address) {
      port = address.port;
    } else {
      port = 3001;
    }
    baseUrl = `http://localhost:${port}`;

    gateway = moduleFixture.get<MetricsGateway>(MetricsGateway);
  });

  afterAll(async () => {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
    await app.close();
  });

  beforeEach(() => {
    socket = createSocketClient(baseUrl);
  });

  afterEach(() => {
    if (socket?.connected) {
      socket.disconnect();
    }
    socket = null;
  });

  it('should connect to WebSocket gateway', (done) => {
    if (!socket) {
      done(new Error('Socket not initialized'));
      return;
    }

    socket.on('connect', () => {
      expect(socket?.connected).toBe(true);
      done();
    });

    socket.connect();
  });

  it('should receive job-completed event when gateway emits', (done) => {
    if (!socket) {
      done(new Error('Socket not initialized'));
      return;
    }

    socket.on('connect', () => {
      const testEvent: JobCompletedEvent = {
        jobId: 'test-job-123',
        eventId: 'evt_e2e_test',
        provider: 'stripe',
        processingTime: 50,
        timestamp: new Date().toISOString(),
      };

      gateway.emitJobCompleted(testEvent);
    });

    socket.on('job-completed', (data: JobCompletedEvent) => {
      expect(data).toBeDefined();
      expect(data.jobId).toBe('test-job-123');
      expect(data.eventId).toBe('evt_e2e_test');
      expect(data.provider).toBe('stripe');
      expect(data.processingTime).toBe(50);
      expect(data.timestamp).toBeDefined();
      done();
    });

    socket.connect();
  });

  it('should handle disconnection gracefully', (done) => {
    if (!socket) {
      done(new Error('Socket not initialized'));
      return;
    }

    socket.on('connect', () => {
      socket?.disconnect();
    });

    socket.on('disconnect', () => {
      expect(socket?.connected).toBe(false);
      done();
    });

    socket.connect();
  });

  it('should emit job-completed event when webhook is processed', (done) => {
    if (!socket) {
      done(new Error('Socket not initialized'));
      return;
    }

    const testEventId = `evt_e2e_${Date.now()}`;
    let eventReceived = false;
    let socketConnected = false;

    // Set up listener BEFORE connecting
    socket.on('job-completed', (data: JobCompletedEvent) => {
      if (!eventReceived && data.eventId === testEventId) {
        eventReceived = true;
        expect(data.provider).toBe('stripe');
        expect(data.jobId).toBeDefined();
        expect(data.processingTime).toBeGreaterThanOrEqual(0);
        expect(data.timestamp).toBeDefined();
        done();
      }
    });

    socket.on('connect', () => {
      socketConnected = true;
      // Wait a bit longer to ensure worker is ready to process jobs
      setTimeout(() => {
        request(app.getHttpServer())
          .post('/webhooks/stripe')
          .send({
            eventId: testEventId,
            timestamp: new Date().toISOString(),
            data: {
              type: 'payment_intent.succeeded',
              amount: 1000,
            },
          })
          .expect(202)
          .end((err) => {
            if (err) {
              done(err);
            }
            // Event should be emitted by WebhookProcessor after job completes
            // Job processing is async, so we wait for the WebSocket event
          });
      }, 500); // Increased delay to ensure worker is ready
    });

    socket.connect();

    setTimeout(() => {
      if (!eventReceived) {
        const errorMsg = socketConnected
          ? 'WebSocket event not received within timeout (job may not have been processed)'
          : 'Socket did not connect';
        done(new Error(errorMsg));
      }
    }, 10000);
  }, 15000); // 15 second timeout for this test
});
