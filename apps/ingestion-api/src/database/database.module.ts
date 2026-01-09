import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { webhookEvents } from '@distributed-systems-lab/database';

/** Injection token for the Drizzle database instance */
export const DATABASE_CONNECTION = 'DATABASE_CONNECTION';

/** Schema definition for type inference */
const schema = { webhookEvents };

/** Type-safe database instance type for dependency injection */
export type DatabaseConnection = PostgresJsDatabase<typeof schema>;

@Global()
@Module({
  providers: [
    {
      provide: DATABASE_CONNECTION,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const connectionString = `postgresql://${config.getOrThrow<string>('DB_USER')}:${config.getOrThrow<string>('DB_PASSWORD')}@${config.getOrThrow<string>('DB_HOST')}:${config.getOrThrow<string>('DB_PORT')}/${config.getOrThrow<string>('DB_NAME')}`;

        const client = postgres(connectionString, {
          max: 10,
          idle_timeout: 20,
          connect_timeout: 10,
        });

        return drizzle(client, { schema });
      },
    },
  ],
  exports: [DATABASE_CONNECTION],
})
export class DatabaseModule {}
