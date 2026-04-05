import { StorageService } from '#/storage/storage.service';
import {
  RedisClient,
  StatusService,
  WebhookQueue,
  WebhookWorker,
} from '#/notifications';
import type { RedisConfig } from '#/notifications/redis.client';
import { DatabaseService } from '#/streams/postgres-writer';
import { MemoryMonitor } from '#/monitoring/memory';
import type {
  ProcessRouteDeps,
  StatusRouteDeps,
  UploadRouteDeps,
} from './route-deps';

function loadRedisConfig(): RedisConfig {
  return {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
  };
}

/**
 * Singletons for one Stream API process — constructed from environment variables.
 * Serves as the manual composition root (no DI framework).
 */
export interface StreamApiContainer {
  readonly redisClient: RedisClient;
  readonly storageService: StorageService;
  readonly statusService: StatusService;
  readonly webhookQueue: WebhookQueue;
  readonly webhookWorker: WebhookWorker;
  readonly databaseService: DatabaseService;
  readonly memoryMonitor: MemoryMonitor;

  /** Route dependencies for POST /upload */
  uploadDeps(): UploadRouteDeps;
  /** Route dependencies for POST /upload/:uploadId/process */
  processDeps(): ProcessRouteDeps;
  /** Route dependencies for GET /upload/:uploadId/status */
  statusDeps(): StatusRouteDeps;
}

/**
 * Builds the application graph: Redis, S3 storage, Postgres pool, BullMQ queue/worker, status store.
 */
export function createStreamApiContainer(): StreamApiContainer {
  const redisConfig = loadRedisConfig();
  const redisClient = new RedisClient(redisConfig);

  const storageService = new StorageService({
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION || 'us-east-1',
    accessKeyId: process.env.S3_ACCESS_KEY || '',
    secretAccessKey: process.env.S3_SECRET_KEY || '',
    bucket: process.env.S3_BUCKET || '',
  });

  const statusService = new StatusService(redisClient.instance);
  const webhookQueue = new WebhookQueue(redisConfig);
  const webhookWorker = new WebhookWorker(redisConfig);

  const databaseService = new DatabaseService({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'dev_user',
    password: process.env.DB_PASSWORD || 'dev_password',
    database: process.env.DB_NAME || 'distributed_lab',
  });

  const memoryMonitor = new MemoryMonitor();

  return {
    redisClient,
    storageService,
    statusService,
    webhookQueue,
    webhookWorker,
    databaseService,
    memoryMonitor,

    uploadDeps(): UploadRouteDeps {
      return { storageService, statusService };
    },

    processDeps(): ProcessRouteDeps {
      return {
        storageService,
        statusService,
        webhookQueue,
        databaseService,
      };
    },

    statusDeps(): StatusRouteDeps {
      return { statusService };
    },
  };
}
