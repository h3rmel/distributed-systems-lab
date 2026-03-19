import { describe, it, expect, afterAll } from 'vitest';
import { io, type Socket } from 'socket.io-client';
import { fetchJSON, ingestionUrl, getIngestionApiUrl, randomEventId, sleep } from './helpers.js';

describe('Live Dashboard — E2E (WebSocket)', () => {
  let socket: Socket;

  afterAll(() => {
    socket?.disconnect();
  });

  it('connects to WebSocket gateway', async () => {
    socket = io(getIngestionApiUrl(), {
      transports: ['websocket'],
      reconnection: false,
      timeout: 10_000,
    });

    await new Promise<void>((resolve, reject) => {
      socket.on('connect', resolve);
      socket.on('connect_error', reject);
    });

    expect(socket.connected).toBe(true);
  });

  it('receives job-completed event after webhook ingestion', async () => {
    socket = io(getIngestionApiUrl(), {
      transports: ['websocket'],
      reconnection: false,
      timeout: 10_000,
    });

    await new Promise<void>((resolve, reject) => {
      socket.on('connect', resolve);
      socket.on('connect_error', reject);
    });

    const eventId = randomEventId();
    const receivedEvent = new Promise<Record<string, unknown>>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Timed out waiting for job-completed')), 15_000);
      socket.on('job-completed', (data: Record<string, unknown>) => {
        if (data.eventId === eventId) {
          clearTimeout(timer);
          resolve(data);
        }
      });
    });

    await fetchJSON(ingestionUrl('/webhooks/stripe'), {
      method: 'POST',
      body: JSON.stringify({
        eventId,
        timestamp: new Date().toISOString(),
        data: { type: 'payment_intent.succeeded', amount: 5000 },
      }),
    });

    const event = await receivedEvent;
    expect(event.eventId).toBe(eventId);
    expect(event.provider).toBe('stripe');
  });
});
