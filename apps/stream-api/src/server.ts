import fastify from "fastify";
import multipart from "@fastify/multipart";

const app = fastify({ logger: true });

await app.register(multipart, {
  limits: {
    fileSize: 5 * 1024 * 1024 * 1024, // 5GB
  }
});

app.get('/health', async () => {
  return { status: 'ok' };
})

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3002;
    
    await app.listen({ port, host: '0.0.0.0' });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

start();