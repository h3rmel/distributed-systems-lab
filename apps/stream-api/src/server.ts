import 'dotenv/config';
import fastify from 'fastify';
import multipart from '@fastify/multipart';
import { createStreamApiContainer } from '#/composition/dependency-container';
import { uploadRoutes } from '#/routes/upload';
import { processRoutes } from '#/routes/process';
import { statusRoutes } from '#/routes/status';

const container = createStreamApiContainer();

const app = fastify({ logger: true });

await app.register(multipart, {
  limits: {
    fileSize: 5 * 1024 * 1024 * 1024, // 5GB
  },
});

await uploadRoutes(app, container.uploadDeps());
await processRoutes(app, container.processDeps());
await statusRoutes(app, container.statusDeps());

app.get('/health', async () => ({ status: 'ok' }));

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3002;

    await app.listen({ port, host: '0.0.0.0' });

    const shutdown = async () => {
      console.log('Shutting down gracefully...');

      container.memoryMonitor.stop();
      await container.webhookWorker.close();
      await container.webhookQueue.close();
      await container.redisClient.close();
      await container.databaseService.close();
      container.storageService.close();
      await app.close();
      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

    container.memoryMonitor.start();
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

start();
