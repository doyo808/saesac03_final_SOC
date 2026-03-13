#!/usr/bin/env bash
set -euo pipefail

TARGET_DIR="${1:-.}"

if ! command -v docker >/dev/null 2>&1; then
  echo "ERROR: docker is not installed." >&2
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "ERROR: docker compose plugin is not available." >&2
  exit 1
fi

cd "$TARGET_DIR"

if [ ! -f ".env" ]; then
  echo "ERROR: .env not found in $TARGET_DIR" >&2
  echo "Copy .env.example to .env and update values first." >&2
  exit 1
fi

echo "[1/4] Pull latest image tags from registry"
docker compose pull

echo "[2/4] Recreate service with latest pulled image"
docker compose up -d --remove-orphans

echo "[3/4] Container status"
docker compose ps

HEALTHCHECK_URL="$(grep -E '^HEALTHCHECK_URL=' .env | head -n 1 | cut -d '=' -f 2- || true)"
if [ -n "$HEALTHCHECK_URL" ]; then
  if command -v curl >/dev/null 2>&1; then
    echo "[4/4] Health check: $HEALTHCHECK_URL"
    curl -fsS "$HEALTHCHECK_URL" >/dev/null
    echo "Health check passed."
  else
    echo "[4/4] curl not installed, skip health check."
  fi
else
  echo "[4/4] HEALTHCHECK_URL not set, skip health check."
fi
