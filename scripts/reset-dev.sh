#!/usr/bin/env bash
set -euo pipefail

COMPOSE="docker compose"
DB_USER="${DB_USER:-dev_user}"
DB_NAME="${DB_NAME:-distributed_lab}"

echo "=== Resetting development environment ==="

echo "[1/3] Truncating webhook_events table..."
$COMPOSE exec -T postgres psql -U "$DB_USER" -d "$DB_NAME" \
  -c "TRUNCATE TABLE webhook_events RESTART IDENTITY;"

echo "[2/3] Flushing Redis..."
$COMPOSE exec -T redis redis-cli FLUSHDB

echo "[3/3] Clearing MinIO csv-uploads bucket..."
$COMPOSE exec -T minio mc alias set local http://localhost:9000 minioadmin minioadmin 2>/dev/null || true
$COMPOSE exec -T minio mc rm --recursive --force local/csv-uploads 2>/dev/null || true

echo "=== Done. Dev environment reset. ==="
