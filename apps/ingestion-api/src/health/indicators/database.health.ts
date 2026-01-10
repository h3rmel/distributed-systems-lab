import { Inject, Injectable } from '@nestjs/common';
import {
  HealthIndicatorResult,
  HealthIndicatorService,
} from '@nestjs/terminus';
import { DATABASE_CONNECTION, type DatabaseConnection } from 'src/database';

@Injectable()
export class DatabaseHealthIndicator {
  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
    @Inject(DATABASE_CONNECTION) private readonly db: DatabaseConnection,
  ) {}

  async isHealth(key: string): Promise<HealthIndicatorResult> {
    await this.db.execute('SELECT 1');

    return this.healthIndicatorService.check(key).up();
  }
}
