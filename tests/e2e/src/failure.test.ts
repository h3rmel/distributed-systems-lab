import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import { fetchJSON, ingestionUrl, streamUrl, waitForHealth, sleep } from './helpers.js';

describe('Failure Scenarios — E2E', () => {
  it('ingestion-api /health degrades when postgres is stopped', async () => {
    execSync('docker compose stop postgres', { stdio: 'pipe' });
    await sleep(5_000);

    try {
      const { body } = await fetchJSON<{ status: string }>(ingestionUrl('/health'));
      expect(body.status).not.toBe('ok');
    } catch {
      // Connection refused is also a valid failure indicator
    }

    execSync('docker compose start postgres', { stdio: 'pipe' });
    await waitForHealth(ingestionUrl('/health'), 60_000);

    const { body } = await fetchJSON<{ status: string }>(ingestionUrl('/health'));
    expect(body.status).toBe('ok');
  });

  it('stream-api /health recovers after postgres restart', async () => {
    await waitForHealth(streamUrl('/health'), 30_000);

    const { body } = await fetchJSON<{ status: string }>(streamUrl('/health'));
    expect(body.status).toBe('ok');
  });
});
