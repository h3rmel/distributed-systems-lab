#!/bin/bash

# =============================================================================
# Rate Limit Test Script
# Tests: @fastify/rate-limit configuration (100 requests per minute)
# Expected: First 100 requests return 200, request 101+ return 429
# =============================================================================

API_URL="${API_URL:-http://localhost:3001}"
ENDPOINT="${1:-/health}"
TOTAL_REQUESTS="${2:-105}"

echo "=== Rate Limit Test ==="
echo "URL: ${API_URL}${ENDPOINT}"
echo "Total requests: ${TOTAL_REQUESTS}"
echo ""

# Counters
success_count=0
rate_limited_count=0
error_count=0

# Track first rate-limited request
first_429=""

echo "Sending requests..."
echo ""

for i in $(seq 1 $TOTAL_REQUESTS); do
  http_code=$(curl -s -o /dev/null -w "%{http_code}" "${API_URL}${ENDPOINT}")
  
  case $http_code in
    200)
      ((success_count++))
      ;;
    429)
      ((rate_limited_count++))
      if [ -z "$first_429" ]; then
        first_429=$i
      fi
      ;;
    *)
      ((error_count++))
      echo "  Request #${i}: Unexpected status ${http_code}"
      ;;
  esac
  
  # Progress indicator every 10 requests
  if [ $((i % 10)) -eq 0 ]; then
    echo "  Progress: ${i}/${TOTAL_REQUESTS} requests sent"
  fi
done

echo ""
echo "=== Results ==="
echo "  ✓ Successful (200): ${success_count}"
echo "  ⛔ Rate limited (429): ${rate_limited_count}"
if [ $error_count -gt 0 ]; then
  echo "  ✗ Errors: ${error_count}"
fi

if [ -n "$first_429" ]; then
  echo ""
  echo "  First 429 at request #${first_429}"
fi

echo ""

# Validation
if [ $rate_limited_count -gt 0 ]; then
  echo "✅ Rate limiting is WORKING"
  exit 0
else
  echo "❌ Rate limiting NOT triggered (expected 429 after 100 requests)"
  exit 1
fi

