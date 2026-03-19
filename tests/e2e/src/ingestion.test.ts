import { describe, it, expect, afterAll } from 'vitest';
import { fetchJSON, ingestionUrl, createDb, sleep, randomEventId } from './helpers.js';

const sql = createDb();

afterAll(async () => {
  await sql.end();
});

describe('Ingestion API — E2E', () => {
  it('POST /webhooks/:provider returns 202 with jobId', async () => {
    const eventId = randomEventId();
    const { status, body } = await fetchJSON<{ accepted: boolean; jobId: string }>(
      ingestionUrl('/webhooks/stripe'),
      {
        method: 'POST',
        body: JSON.stringify({
          eventId,
          timestamp: new Date().toISOString(),
          data: { type: 'payment_intent.succeeded', amount: 4200 },
        }),
      },
    );

    expect(status).toBe(202);
    expect(body.accepted).toBe(true);
    expect(body.jobId).toBeDefined();
  });

  it('webhook event is persisted to PostgreSQL after processing', async () => {
    const eventId = randomEventId();
    await fetchJSON(ingestionUrl('/webhooks/stripe'), {
      method: 'POST',
      body: JSON.stringify({
        eventId,
        timestamp: new Date().toISOString(),
        data: { type: 'charge.succeeded', amount: 1000 },
      }),
    });

    await sleep(3_000);

    const rows = await sql`
      SELECT * FROM webhook_events WHERE event_id = ${eventId}
    `;

    expect(rows).toHaveLength(1);
    expect(rows[0].provider).toBe('stripe');
    expect(rows[0].event_id).toBe(eventId);
  });

  it('duplicate eventId is accepted but not re-inserted', async () => {
    const eventId = randomEventId();
    const payload = {
      eventId,
      timestamp: new Date().toISOString(),
      data: { type: 'invoice.paid' },
    };

    await fetchJSON(ingestionUrl('/webhooks/paypal'), {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    await sleep(3_000);

    await fetchJSON(ingestionUrl('/webhooks/paypal'), {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    await sleep(2_000);

    const rows = await sql`
      SELECT * FROM webhook_events WHERE event_id = ${eventId}
    `;
    expect(rows).toHaveLength(1);
  });

  it('GET /health returns ok', async () => {
    const { status, body } = await fetchJSON<{ status: string }>(ingestionUrl('/health'));
    expect(status).toBe(200);
    expect(body.status).toBe('ok');
  });

  it('invalid payload returns 400', async () => {
    const { status } = await fetchJSON(ingestionUrl('/webhooks/stripe'), {
      method: 'POST',
      body: JSON.stringify({ missing: 'required fields' }),
    });
    expect(status).toBe(400);
  });
});
