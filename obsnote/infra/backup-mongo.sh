#!/usr/bin/env sh
set -eu

TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_DIR="${1:-./backups}"

mkdir -p "$BACKUP_DIR"

docker compose exec -T mongo sh -lc "mongodump --archive --gzip" > "${BACKUP_DIR}/obsnote_${TIMESTAMP}.archive.gz"
echo "Backup saved to ${BACKUP_DIR}/obsnote_${TIMESTAMP}.archive.gz"

