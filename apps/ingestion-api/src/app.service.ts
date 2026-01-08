import { Inject, Injectable } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DATABASE_CONNECTION } from './database';
import * as schema from '@distributed-systems-lab/database';

@Injectable()
export class AppService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  async getHello(): Promise<string> {
    const result = await this.db.execute<{ test: number }>('SELECT 1 as test');
    return `Database connected! Result: ${JSON.stringify(result)}`;
  }
}
