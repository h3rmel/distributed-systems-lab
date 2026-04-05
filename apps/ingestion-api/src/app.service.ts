import { Inject, Injectable } from '@nestjs/common';
import { DATABASE_CONNECTION, type DatabaseConnection } from './database';

@Injectable()
export class AppService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: DatabaseConnection,
  ) {}

  async getHello(): Promise<string> {
    const result = await this.db.execute<{ test: number }>('SELECT 1 as test');
    return `Database connected! Result: ${JSON.stringify(result)}`;
  }
}
