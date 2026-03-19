import { describe, it, expect, afterAll } from 'vitest';
import { fetchJSON, streamUrl, createDb, sleep } from './helpers.js';

const sql = createDb();
const ROW_COUNT = 100;

afterAll(async () => {
  await sql.end();
});

function generateCSV(count: number): string {
  const header = 'provider,eventId,timestamp,data';
  const rows = Array.from({ length: count }, (_, i) => {
    const eventId = `e2e-stream-${crypto.randomUUID()}`;
    const ts = new Date(Date.now() - (count - i) * 1000).toISOString();
    const data = JSON.stringify({ type: 'batch.import', index: i }).replace(/"/g, '""');
    return `stripe,${eventId},${ts},"${data}"`;
  });
  return [header, ...rows].join('\n');
}

describe('Stream API — E2E', () => {
  it('GET /health returns ok', async () => {
    const { status, body } = await fetchJSON<{ status: string }>(streamUrl('/health'));
    expect(status).toBe(200);
    expect(body.status).toBe('ok');
  });

  it('upload + process pipeline persists all rows', async () => {
    const csv = generateCSV(ROW_COUNT);
    const boundary = '----E2EBoundary' + Date.now();

    const multipartBody = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="file"; filename="test.csv"',
      'Content-Type: text/csv',
      '',
      csv,
      `--${boundary}--`,
    ].join('\r\n');

    const uploadRes = await fetch(streamUrl('/upload'), {
      method: 'POST',
      headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
      body: multipartBody,
    });

    expect(uploadRes.status).toBe(202);
    const uploadBody = (await uploadRes.json()) as {
      uploadId: string;
      objectKey: string;
      status: string;
    };
    expect(uploadBody.uploadId).toBeDefined();
    expect(uploadBody.status).toBe('uploaded');

    const { status, body } = await fetchJSON<{
      status: string;
      rowsProcessed: number;
      rowsInvalid: number;
    }>(streamUrl(`/upload/${uploadBody.uploadId}/process`), { method: 'POST' });

    expect(status).toBe(200);
    expect(body.status).toBe('completed');
    expect(body.rowsProcessed).toBe(ROW_COUNT);
    expect(body.rowsInvalid).toBe(0);
  });

  it('status endpoint reflects completed processing', async () => {
    const csv = generateCSV(10);
    const boundary = '----E2EBoundary' + Date.now();

    const multipartBody = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="file"; filename="small.csv"',
      'Content-Type: text/csv',
      '',
      csv,
      `--${boundary}--`,
    ].join('\r\n');

    const uploadRes = await fetch(streamUrl('/upload'), {
      method: 'POST',
      headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
      body: multipartBody,
    });
    const { uploadId } = (await uploadRes.json()) as { uploadId: string };

    await fetchJSON(streamUrl(`/upload/${uploadId}/process`), { method: 'POST' });

    const { status, body } = await fetchJSON<{ status: string }>(
      streamUrl(`/upload/${uploadId}/status`),
    );
    expect(status).toBe(200);
    expect(body.status).toBe('completed');
  });

  it('POST /upload without file returns 400', async () => {
    const { status } = await fetchJSON(streamUrl('/upload'), { method: 'POST' });
    expect(status).toBe(400);
  });
});
