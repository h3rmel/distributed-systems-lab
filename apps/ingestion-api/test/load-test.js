import http from 'k6/http';
import { check, sleep } from 'k6';
import { randomString } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

/**
 * K6 load test configuration
 * @typedef {Object} K6Options
 * @property {Array<{duration: string, target: number}>} stages - Load test stages
 * @property {Object<string, string[]>} thresholds - Performance thresholds
 */

/**
 * @type {K6Options}
 */
export const options = {
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

/**
 * Webhook payload structure
 * Note: provider comes from URL parameter, not body
 * @typedef {Object} WebhookPayload
 * @property {string} eventId - Unique event identifier for idempotency
 * @property {string} timestamp - ISO timestamp
 * @property {Object} data - Event data
 * @property {number} data.amount - Transaction amount
 * @property {string} data.currency - Currency code
 * @property {string} data.customer_id - Customer identifier
 * @property {string} data.status - Transaction status
 */

/**
 * HTTP request parameters
 * @typedef {Object} RequestParams
 * @property {Object<string, string>} headers - HTTP headers
 */

/**
 * K6 HTTP Response
 * @typedef {Object} Response
 * @property {number} status - HTTP status code
 * @property {string} body - Response body
 */

/**
 * Main load test function
 * Simulates webhook ingestion with 500 concurrent virtual users
 * @returns {void}
 */
export default function () {
  // Payload simulating a Stripe/Payment Provider Webhook
  /** @type {string} */
  const eventId = `evt_${randomString(12)}`; // Unique ID for Idempotency check
  /** @type {string} */
  const customerId = `cus_${randomString(8)}`;

  /** @type {WebhookPayload} */
  const payload = {
    eventId,
    timestamp: new Date().toISOString(),
    data: {
      amount: Math.floor(Math.random() * 10000),
      currency: 'brl',
      customer_id: customerId,
      status: 'succeeded',
    },
  };

  /** @type {RequestParams} */
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // API endpoint (port 3001 for ingestion-api)
  /** @type {string} */
  const url = 'http://localhost:3001/webhooks/stripe';

  /** @type {Response} */
  const res = http.post(url, JSON.stringify(payload), params);

  // Assertions
  check(res, {
    /**
     * Validates HTTP status is 202 Accepted
     * @param {Response} r - HTTP response object
     * @returns {boolean} True if status is 202
     */
    'status is 202': (r) => r.status === 202, // Must be Accepted, not 200 OK
  });

  // Pacing: Random sleep to simulate real traffic variance
  sleep(0.1);
}
