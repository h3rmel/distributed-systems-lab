import postgres from 'postgres';

const INGESTION_API_URL = process.env.INGESTION_API_URL ?? 'http://localhost:3001';
const STREAM_API_URL = process.env.STREAM_API_URL ?? 'http://localhost:3002';
const DB_CONFIG = {
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  user: process.env.DB_USER ?? 'dev_user',
  password: process.env.DB_PASSWORD ?? 'dev_password',
  database: process.env.DB_NAME ?? 'distributed_lab',
};

export function ingestionUrl(path: string): string {
  return `${INGESTION_API_URL}${path}`;
}

export function streamUrl(path: string): string {
  return `${STREAM_API_URL}${path}`;
}

export function getIngestionApiUrl(): string {
  return INGESTION_API_URL;
}

export function createDb(): postgres.Sql {
  return postgres(DB_CONFIG);
}

export async function fetchJSON<T = unknown>(
  url: string,
  init?: RequestInit,
): Promise<{ status: number; body: T }> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });
  const body = (await res.json()) as T;
  return { status: res.status, body };
}

/** Poll a URL until it returns the expected status or timeout. */
export async function waitForHealth(
  url: string,
  timeoutMs = 60_000,
  intervalMs = 2_000,
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      /* service not ready */
    }
    await sleep(intervalMs);
  }
  throw new Error(`Health check timed out after ${timeoutMs}ms: ${url}`);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function randomEventId(): string {
  return `e2e-${crypto.randomUUID()}`;
}
