import 'dotenv/config';
import fastify from "fastify";
import multipart from "@fastify/multipart";
import { uploadRoutes } from "./routes/upload";
import { processRoutes } from "./routes/process";
import { startMemoryMonitoring } from './monitoring/memory';

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

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3002;
    
    await app.listen({ port, host: '0.0.0.0' });

    startMemoryMonitoring();
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

start();