import { describe, it, expect } from 'vitest';
import { FormatterTransform } from './formatter';
import type { ValidatedRow } from './validation';

function collectOutput(transform: FormatterTransform, input: ValidatedRow[]): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const results: string[] = [];

    transform.on('data', (chunk: string) => results.push(chunk));
    transform.on('end', () => resolve(results));
    transform.on('error', reject);

    for (const row of input) {
      transform.write(row);
    }

    transform.end();
  });
}

const baseRow: ValidatedRow = {
  provider: 'github',
  eventId: 'evt-1',
  timestamp: '2026-01-01T00:00:00Z',
  data: '{"key":"value"}',
};

describe('FormatterTransform', () => {
  it('should format a ValidatedRow as CSV line with newline', async () => {
    const transform = new FormatterTransform();

    const output = await collectOutput(transform, [baseRow]);

    expect(output).toHaveLength(1);
    expect(output[0]).toBe('github,evt-1,2026-01-01T00:00:00Z,"{""key"":""value""}"\n');
  });

  it('should escape data containing commas', async () => {
    const transform = new FormatterTransform();
    const row: ValidatedRow = { ...baseRow, data: 'a,b,c' };

    const output = await collectOutput(transform, [row]);

    expect(output[0]).toBe('github,evt-1,2026-01-01T00:00:00Z,"a,b,c"\n');
  });

  it('should escape data containing double quotes', async () => {
    const transform = new FormatterTransform();
    const row: ValidatedRow = { ...baseRow, data: 'say "hello"' };

    const output = await collectOutput(transform, [row]);

    expect(output[0]).toBe('github,evt-1,2026-01-01T00:00:00Z,"say ""hello"""\n');
  });

  it('should escape data containing newlines', async () => {
    const transform = new FormatterTransform();
    const row: ValidatedRow = { ...baseRow, data: 'line1\nline2' };

    const output = await collectOutput(transform, [row]);

    expect(output[0]).toBe('github,evt-1,2026-01-01T00:00:00Z,"line1\nline2"\n');
  });

  it('should not wrap data without special characters', async () => {
    const transform = new FormatterTransform();
    const row: ValidatedRow = { ...baseRow, data: 'plain-text' };

    const output = await collectOutput(transform, [row]);

    expect(output[0]).toBe('github,evt-1,2026-01-01T00:00:00Z,plain-text\n');
  });

  it('should handle multiple rows in sequence', async () => {
    const transform = new FormatterTransform();

    const output = await collectOutput(transform, [
      { ...baseRow, provider: 'github', eventId: 'evt-1' },
      { ...baseRow, provider: 'stripe', eventId: 'evt-2' },
    ]);

    expect(output).toHaveLength(2);
    expect(output[0]).toContain('github,evt-1');
    expect(output[1]).toContain('stripe,evt-2');
  });
});
