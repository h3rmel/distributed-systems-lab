import { describe, it, expect } from 'vitest';
import { ValidationTransform, type CsvRow, type ValidatedRow } from './validation';

function collectOutput(transform: ValidationTransform, input: CsvRow[]): Promise<ValidatedRow[]> {
  return new Promise((resolve, reject) => {
    const results: ValidatedRow[] = [];

    transform.on('data', (row: ValidatedRow) => results.push(row));
    transform.on('end', () => resolve(results));
    transform.on('error', reject);

    for (const row of input) {
      transform.write(row);
    }

    transform.end();
  });
}

describe('ValidationTransform', () => {
  it('should push rows with all 4 required fields', async () => {
    const transform = new ValidationTransform();
    const input: CsvRow[] = [
      { provider: 'github', eventId: 'evt-1', timestamp: '2026-01-01T00:00:00Z', data: '{}' },
    ];

    const output = await collectOutput(transform, input);

    expect(output).toHaveLength(1);
    expect(output[0]).toEqual({
      provider: 'github',
      eventId: 'evt-1',
      timestamp: '2026-01-01T00:00:00Z',
      data: '{}',
    });
  });

  it('should skip rows missing provider', async () => {
    const transform = new ValidationTransform();
    const output = await collectOutput(transform, [
      { eventId: 'evt-1', timestamp: '2026-01-01T00:00:00Z', data: '{}' },
    ]);

    expect(output).toHaveLength(0);
  });

  it('should skip rows missing eventId', async () => {
    const transform = new ValidationTransform();
    const output = await collectOutput(transform, [
      { provider: 'github', timestamp: '2026-01-01T00:00:00Z', data: '{}' },
    ]);

    expect(output).toHaveLength(0);
  });

  it('should skip rows missing timestamp', async () => {
    const transform = new ValidationTransform();
    const output = await collectOutput(transform, [
      { provider: 'github', eventId: 'evt-1', data: '{}' },
    ]);

    expect(output).toHaveLength(0);
  });

  it('should skip rows missing data', async () => {
    const transform = new ValidationTransform();
    const output = await collectOutput(transform, [
      { provider: 'github', eventId: 'evt-1', timestamp: '2026-01-01T00:00:00Z' },
    ]);

    expect(output).toHaveLength(0);
  });

  it('should track rowCount and invalidCount in getStats()', async () => {
    const transform = new ValidationTransform();

    await collectOutput(transform, [
      { provider: 'github', eventId: 'evt-1', timestamp: '2026-01-01T00:00:00Z', data: '{}' },
      { provider: 'github' },
      { provider: 'stripe', eventId: 'evt-2', timestamp: '2026-01-01T00:00:00Z', data: '{}' },
      {},
    ]);

    const stats = transform.getStats();
    expect(stats.total).toBe(4);
    expect(stats.invalid).toBe(2);
  });

  it('should handle multiple valid rows preserving order', async () => {
    const transform = new ValidationTransform();

    const output = await collectOutput(transform, [
      { provider: 'github', eventId: 'evt-1', timestamp: '2026-01-01T00:00:00Z', data: '{"a":1}' },
      { provider: 'stripe', eventId: 'evt-2', timestamp: '2026-01-02T00:00:00Z', data: '{"b":2}' },
    ]);

    expect(output).toHaveLength(2);
    expect(output[0]!.provider).toBe('github');
    expect(output[1]!.provider).toBe('stripe');
  });
});
