import http from 'k6/http';
import { check, sleep } from 'k6';
import { Options } from 'k6/options';
import { randomString } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

export const options: Options = {
  stages: [
    { duration: '10s', target: 50 }, // Warm up
    { duration: '1m', target: 500 }, // ⚠️ STRESS SPIKE: 500 concurrent users
    { duration: '10s', target: 0 }, // Cool down
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'], // Max 1% errors allowed
    http_req_duration: ['p(95)<100'], // 95% of requests must accept in under 100ms
  },
};

interface WebhookPayload {
  eventId: string;
  timestamp: string;
  data: {
    amount: number;
    currency: string;
    customer_id: string;
    status: string;
  };
}

export default function () {
  const eventId = `evt_${randomString(12)}`;
  const customerId = `cus_${randomString(8)}`;

  const payload: WebhookPayload = {
    eventId,
    timestamp: new Date().toISOString(),
    data: {
      amount: Math.floor(Math.random() * 10000),
      currency: 'brl',
      customer_id: customerId,
      status: 'succeeded',
    },
  };

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const url = 'http://localhost:3001/webhooks/stripe';

  const res = http.post(url, JSON.stringify(payload), params);

  check(res, {
    'status is 202': (r) => r.status === 202,
  });

  sleep(0.1);
}
