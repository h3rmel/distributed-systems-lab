import 'dotenv/config';
import fastify from 'fastify';
import multipart from '@fastify/multipart';
import { StorageService } from '#/storage';
import { RedisClient, StatusService, WebhookQueue, WebhookWorker } from '#/notifications';
import { DatabaseService } from '#/streams/postgres-writer';
import { MemoryMonitor } from '#/monitoring/memory';
import { uploadRoutes } from '#/routes/upload';
import { processRoutes } from '#/routes/process';
import { statusRoutes } from '#/routes/status';

declare module 'fastify' {
  interface FastifyInstance {
    storageService: StorageService;
    statusService: StatusService;
    webhookQueue: WebhookQueue;
    databaseService: DatabaseService;
  }
}

const redisConfig = {
  host: process.env.REDIS_HOST ?? 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
};

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

const app = fastify({ logger: true });

await app.register(multipart, {
  limits: {
    fileSize: 5 * 1024 * 1024 * 1024, // 5GB
  },
});

app.decorate('storageService', storageService);
app.decorate('statusService', statusService);
app.decorate('webhookQueue', webhookQueue);
app.decorate('databaseService', databaseService);

app.get('/health', async () => ({ status: 'ok' }));
app.register(uploadRoutes);
app.register(processRoutes);
app.register(statusRoutes);

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3002;

    await app.listen({ port, host: '0.0.0.0' });

    const shutdown = async () => {
      console.log('Shutting down gracefully...');

      memoryMonitor.stop();
      await webhookWorker.close();
      await webhookQueue.close();
      await redisClient.close();
      await databaseService.close();
      storageService.close();
      await app.close();
      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

    memoryMonitor.start();
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

start();