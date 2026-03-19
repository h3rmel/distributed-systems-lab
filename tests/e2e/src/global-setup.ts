import { execSync } from 'node:child_process';
import { waitForHealth, ingestionUrl, streamUrl, createDb } from './helpers.js';

const COMPOSE_SERVICES = ['postgres', 'redis', 'minio', 'ingestion-api', 'stream-api'];

export async function setup(): Promise<void> {
  console.log('\n[E2E] Starting infrastructure via docker compose...');
  execSync(`docker compose up -d ${COMPOSE_SERVICES.join(' ')}`, {
    stdio: 'inherit',
    cwd: process.cwd(),
  });

  console.log('[E2E] Waiting for services to be healthy...');
  await Promise.all([
    waitForHealth(ingestionUrl('/health'), 90_000),
    waitForHealth(streamUrl('/health'), 90_000),
  ]);
  console.log('[E2E] All services healthy. Running tests...\n');
}

export async function teardown(): Promise<void> {
  console.log('\n[E2E] Cleaning up test data...');
  const sql = createDb();
  try {
    await sql`DELETE FROM webhook_events WHERE event_id LIKE 'e2e-%'`;
  } catch {
    console.warn('[E2E] Could not clean webhook_events (table may not exist)');
  } finally {
    await sql.end();
  }
  console.log('[E2E] Teardown complete.\n');
}
