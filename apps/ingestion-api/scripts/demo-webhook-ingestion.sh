#!/bin/bash

# =============================================================================
# Webhook Ingestion Demo Script
# Demonstrates: 2 successful webhooks + 1 duplicate detection (idempotency)
# =============================================================================

echo "=== Webhook Ingestion Demo ==="
echo ""

# 1. First webhook - Stripe (NEW)
echo "1. Sending Stripe webhook..."
curl -s -X POST http://localhost:3001/webhooks/stripe \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "evt_stripe_2026_01_09_A",
    "timestamp": "2026-01-09T16:00:00.000Z",
    "data": {
      "type": "payment_intent.succeeded",
      "amount": 25000,
      "currency": "brl",
      "customer_id": "cus_stripe_demo"
    }
  }'

echo ""
echo ""

# Small pause to ensure processing completes
sleep 1

# 2. Second webhook - PayPal (NEW)
echo "2. Sending PayPal webhook..."
curl -s -X POST http://localhost:3001/webhooks/paypal \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "evt_paypal_2026_01_09_B",
    "timestamp": "2026-01-09T16:00:05.000Z",
    "data": {
      "type": "PAYMENT.CAPTURE.COMPLETED",
      "amount": 12000,
      "currency": "brl",
      "payer_id": "PAYPAL_DEMO_123"
    }
  }'

echo ""
echo ""

sleep 1

# 3. Duplicate - Same eventId as the first (should be rejected by idempotency check)
echo "3. Sending DUPLICATE webhook (same eventId as #1)..."
curl -s -X POST http://localhost:3001/webhooks/stripe \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "evt_stripe_2026_01_09_A",
    "timestamp": "2026-01-09T16:00:00.000Z",
    "data": {
      "type": "payment_intent.succeeded",
      "amount": 25000,
      "currency": "brl",
      "customer_id": "cus_stripe_demo"
    }
  }'

echo ""
echo ""
echo "=== Demo completed ==="
