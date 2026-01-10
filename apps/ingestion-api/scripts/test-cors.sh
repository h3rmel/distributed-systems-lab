#!/bin/bash

# =============================================================================
# CORS Test Script
# Tests: @fastify/cors configuration
# Verifies: Preflight requests and Access-Control headers
# =============================================================================

API_URL="${API_URL:-http://localhost:3001}"
ENDPOINT="${1:-/health}"

# Test origins
ALLOWED_ORIGIN="${ALLOWED_ORIGIN:-http://localhost:3000}"
BLOCKED_ORIGIN="http://malicious-site.com"

echo "=== CORS Test ==="
echo "URL: ${API_URL}${ENDPOINT}"
echo "Allowed origin: ${ALLOWED_ORIGIN}"
echo "Blocked origin: ${BLOCKED_ORIGIN}"
echo ""

# =============================================================================
# Test 1: Simple request from allowed origin
# =============================================================================
echo "--- Test 1: Simple request from ALLOWED origin ---"
response=$(curl -s -I "${API_URL}${ENDPOINT}" \
  -H "Origin: ${ALLOWED_ORIGIN}")

acao=$(echo "$response" | grep -i "^access-control-allow-origin:" | cut -d':' -f2- | tr -d ' \r')

if [ -n "$acao" ]; then
  echo "  Access-Control-Allow-Origin: ${acao}"
  if [ "$acao" = "$ALLOWED_ORIGIN" ] || [ "$acao" = "*" ]; then
    echo "  ✅ Allowed origin accepted"
    test1_pass=true
  else
    echo "  ⚠️  Unexpected value"
    test1_pass=false
  fi
else
  echo "  ❌ No Access-Control-Allow-Origin header"
  test1_pass=false
fi
echo ""

# =============================================================================
# Test 2: Preflight request (OPTIONS) from allowed origin
# =============================================================================
echo "--- Test 2: Preflight (OPTIONS) from ALLOWED origin ---"
response=$(curl -s -I -X OPTIONS "${API_URL}${ENDPOINT}" \
  -H "Origin: ${ALLOWED_ORIGIN}" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type")

http_code=$(echo "$response" | head -1 | awk '{print $2}')
acao=$(echo "$response" | grep -i "^access-control-allow-origin:" | cut -d':' -f2- | tr -d ' \r')
acam=$(echo "$response" | grep -i "^access-control-allow-methods:" | cut -d':' -f2- | tr -d '\r')
acah=$(echo "$response" | grep -i "^access-control-allow-headers:" | cut -d':' -f2- | tr -d '\r')

echo "  HTTP Status: ${http_code}"
echo "  Access-Control-Allow-Origin: ${acao:-MISSING}"
echo "  Access-Control-Allow-Methods: ${acam:-MISSING}"
echo "  Access-Control-Allow-Headers: ${acah:-MISSING}"

if [ "$http_code" = "204" ] || [ "$http_code" = "200" ]; then
  echo "  ✅ Preflight successful"
  test2_pass=true
else
  echo "  ❌ Preflight failed"
  test2_pass=false
fi
echo ""

# =============================================================================
# Test 3: Request from blocked origin
# =============================================================================
echo "--- Test 3: Request from BLOCKED origin ---"
response=$(curl -s -I "${API_URL}${ENDPOINT}" \
  -H "Origin: ${BLOCKED_ORIGIN}")

acao=$(echo "$response" | grep -i "^access-control-allow-origin:" | cut -d':' -f2- | tr -d ' \r')

if [ -z "$acao" ] || [ "$acao" != "$BLOCKED_ORIGIN" ]; then
  echo "  Access-Control-Allow-Origin: ${acao:-NOT SET}"
  echo "  ✅ Blocked origin rejected (or not echoed)"
  test3_pass=true
else
  echo "  Access-Control-Allow-Origin: ${acao}"
  echo "  ❌ Blocked origin was allowed!"
  test3_pass=false
fi
echo ""

# =============================================================================
# Results
# =============================================================================
echo "=== Results ==="
pass_count=0
fail_count=0

if $test1_pass; then ((pass_count++)); else ((fail_count++)); fi
if $test2_pass; then ((pass_count++)); else ((fail_count++)); fi
if $test3_pass; then ((pass_count++)); else ((fail_count++)); fi

echo "  ✓ Passed: ${pass_count}/3"
echo "  ✗ Failed: ${fail_count}/3"
echo ""

if [ $fail_count -eq 0 ]; then
  echo "✅ CORS is WORKING"
  exit 0
else
  echo "⚠️  Some CORS tests failed"
  exit 1
fi

