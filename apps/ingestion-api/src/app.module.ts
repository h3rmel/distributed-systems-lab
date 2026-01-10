import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database';
import { BullModule } from '@nestjs/bullmq';
import { WebhookModule } from './webhook';
import { WorkerModule } from './worker';
import { HealthModule } from './health';
import { MetricsModule } from './metrics';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        // Check NODE_ENV directly from process.env to avoid ConfigService timing issues
        const nodeEnv = process.env.NODE_ENV || config.get('NODE_ENV', 'development');
        const isDevelopment = nodeEnv !== 'production';

        const pinoConfig: {
          level: string;
          transport?: { target: string; options: { colorize: boolean } };
        } = {
          level: config.get('LOG_LEVEL', 'info'),
        };

        // Only add transport in development (when pino-pretty is available)
        if (isDevelopment) {
          pinoConfig.transport = {
            target: 'pino-pretty',
            options: { colorize: true },
          };
        }

        return {
          pinoHttp: pinoConfig,
        };
      },
    }),

    DatabaseModule,

    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get('REDIS_HOST', 'localhost'),
          port: config.get('REDIS_PORT', 6379),
        },
      }),
    }),

    WebhookModule,
    WorkerModule,
    HealthModule,
    MetricsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
