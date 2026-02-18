import { Transform, TransformCallback } from 'node:stream';

/**
 * Represents a parsed CSV row before validation.
 */
export type CsvRow = {
  provider?: string;
  eventId?: string;
  timestamp?: string;
  data?: string;
} & Record<string, string | undefined>;

/**
 * Represents a validated webhook event row.
 */
export interface ValidatedRow {
  provider: string;
  eventId: string;
  timestamp: string;
  data: string;
}

/**
 * Transform stream that validates CSV rows.
 * Invalid rows are logged and skipped (not pushed downstream).
 */
export class ValidationTransform extends Transform {
  private rowCount = 0;
  private invalidCount = 0;

  constructor() {
    super({ objectMode: true, highWaterMark: 100 });
  }

  _transform(row: CsvRow, _encoding: BufferEncoding, callback: TransformCallback): void {
    this.rowCount++;

    if (!row.provider || !row.eventId || !row.timestamp || !row.data) {
      this.invalidCount++;

      callback();

      return;
    }

    const validatedRow: ValidatedRow = {
      provider: row.provider,
      eventId: row.eventId,
      timestamp: row.timestamp,
      data: row.data,
    };

    this.push(validatedRow);
    callback();
  }

  _flush(callback: TransformCallback): void {
    console.log(
      `Validation complete: ${this.rowCount} rows processed, ${this.invalidCount} invalid`,
    );
    callback();
  }

  getStats(): { total: number; invalid: number } {
    return { total: this.rowCount, invalid: this.invalidCount };
  }
}
