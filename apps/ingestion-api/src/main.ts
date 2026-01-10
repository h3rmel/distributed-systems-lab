import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    {
      bufferLogs: true,
    },
  );

  app.useLogger(app.get(Logger));

  await app.register(helmet);

  await app.register(cors, {
    origin: process.env.ALLOWED_ORIGINS?.split(',') ?? [
      'http://localhost:3000',
    ],
    credentials: true,
  });

  await app.register(rateLimit, {
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    timeWindow: '1 minute',
    // Exclude routes from rate limiting
    // allowList can be a function that returns truthy to exclude from rate limit
    allowList: (request) => {
      // Always exclude health endpoint
      if (request.url === '/health') {
        return true;
      }
      // Exclude webhook endpoints if DISABLE_WEBHOOK_RATE_LIMIT is set
      if (
        process.env.DISABLE_WEBHOOK_RATE_LIMIT === 'true' &&
        request.url?.startsWith('/webhooks/')
      ) {
        return true;
      }
      return false;
    },
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Listen on 0.0.0.0 for Docker compatibility
  await app.listen(process.env.PORT ?? 3001, '0.0.0.0');
}
void bootstrap();
