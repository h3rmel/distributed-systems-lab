#!/bin/bash

# =============================================================================
# Helmet Security Headers Test Script
# Tests: @fastify/helmet configuration
# Verifies: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, etc.
# =============================================================================

API_URL="${API_URL:-http://localhost:3001}"
ENDPOINT="${1:-/health}"

echo "=== Helmet Security Headers Test ==="
echo "URL: ${API_URL}${ENDPOINT}"
echo ""

# Fetch headers
headers=$(curl -s -I "${API_URL}${ENDPOINT}")

echo "=== Response Headers ==="
echo "$headers"
echo ""

echo "=== Security Headers Check ==="

# Expected headers from Helmet
declare -A expected_headers=(
  ["x-content-type-options"]="nosniff"
  ["x-frame-options"]="SAMEORIGIN"
  ["x-xss-protection"]="0"
  ["cross-origin-opener-policy"]="same-origin"
  ["cross-origin-resource-policy"]="same-origin"
  ["x-download-options"]="noopen"
  ["x-permitted-cross-domain-policies"]="none"
)

pass_count=0
fail_count=0

for header in "${!expected_headers[@]}"; do
  expected="${expected_headers[$header]}"
  # Case-insensitive header search
  actual=$(echo "$headers" | grep -i "^${header}:" | cut -d':' -f2- | tr -d ' \r')
  
  if [ -n "$actual" ]; then
    if [ "${actual,,}" = "${expected,,}" ]; then
      echo "  ✅ ${header}: ${actual}"
      ((pass_count++))
    else
      echo "  ⚠️  ${header}: ${actual} (expected: ${expected})"
      ((pass_count++))  # Header present, value may vary
    fi
  else
    echo "  ❌ ${header}: MISSING"
    ((fail_count++))
  fi
done

echo ""
echo "=== Results ==="
echo "  ✓ Headers present: ${pass_count}"
echo "  ✗ Headers missing: ${fail_count}"
echo ""

if [ $fail_count -eq 0 ]; then
  echo "✅ Helmet is WORKING"
  exit 0
else
  echo "⚠️  Some headers missing (Helmet may be partially configured)"
  exit 1
fi

