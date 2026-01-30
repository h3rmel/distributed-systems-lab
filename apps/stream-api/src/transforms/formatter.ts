import { Transform, TransformCallback } from "node:stream";
import { ValidatedRow } from "./validation";

/**
 * Transform stream that converts validated rows to CSV format
 * for Postgres COPY protocol.
 *
 * Output format: provider,eventId,timestamp,data\n
 */
export class FormatterTransform extends Transform {
  constructor() {
    super({ objectMode: true, highWaterMark: 100 });
  }

  _transform(
    row: ValidatedRow,
    _encoding: BufferEncoding,
    callback: TransformCallback,
  ): void {
    // Escape data field for CSV (handle quotes and special chars)
    const escapedData = this.escapeForCsv(row.data);

    // Format as CSV line: provider,eventId,timestamp,data
    const csvLine = `${row.provider},${row.eventId},${row.timestamp},${escapedData}\n`;

    this.push(csvLine);
    callback();
  }

  /**
   * Escapes a string for CSV format.
   * - Wraps in quotes if contains comma, quote, or newline
   * - Doubles internal quotes
   */
  private escapeForCsv(value: string): string {
    // If value contains special chars, wrap in quotes and escape internal quotes
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
}