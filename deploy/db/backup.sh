#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if [ ! -f ".env" ]; then
  echo "ERROR: .env not found in $SCRIPT_DIR" >&2
  echo "Copy .env.example to .env and update values first." >&2
  exit 1
fi

set -a
# shellcheck disable=SC1091
. ./.env
set +a

if [ -z "${POSTGRES_DB:-}" ] || [ -z "${POSTGRES_USER:-}" ]; then
  echo "ERROR: POSTGRES_DB and POSTGRES_USER are required in .env" >&2
  exit 1
fi

mkdir -p backups
TS="$(date +%Y%m%d_%H%M%S)"
OUT_FILE="backups/${POSTGRES_DB}_${TS}.sql"

echo "Creating DB backup: $OUT_FILE"
docker compose exec -T campus-postgres pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > "$OUT_FILE"
gzip -f "$OUT_FILE"
echo "Backup complete: ${OUT_FILE}.gz"
