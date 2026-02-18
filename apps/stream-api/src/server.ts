import 'dotenv/config';
import fastify from "fastify";
import multipart from "@fastify/multipart";
import { uploadRoutes } from "./routes/upload";
import { processRoutes } from "./routes/process";
import { startMemoryMonitoring } from './monitoring/memory';
import { statusRoutes } from './routes/status';
import { closeWebhookQueue, disconnectRedis, closeWebhookWorker } from './notifications';

const app = fastify({ logger: true });

await app.register(multipart, {
  limits: {
    fileSize: 5 * 1024 * 1024 * 1024, // 5GB
  }
});

app.get('/health', async () => {
  return { status: 'ok' };
})

app.register(uploadRoutes);
app.register(processRoutes);
app.register(statusRoutes);

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3002;
    
    await app.listen({ port, host: '0.0.0.0' });

    const shutdown = async () => {
      console.log('Shutting down gracefully...');

      await closeWebhookWorker();
      await closeWebhookQueue();
      await disconnectRedis();
      await app.close();
      process.exit(0);
    }

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

    startMemoryMonitoring();
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

start();