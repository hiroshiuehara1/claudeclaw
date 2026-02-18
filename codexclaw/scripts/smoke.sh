#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ ! -d node_modules ]]; then
  echo "[smoke] Installing dependencies"
  npm install --no-audit --no-fund --fetch-retries=0 --fetch-timeout=5000
fi

echo "[smoke] Building"
npm run build

echo "[smoke] Doctor"
node dist/bin/codexclaw.js doctor

echo "[smoke] One-shot run via codex"
node dist/bin/codexclaw.js run "Reply with exactly OK" --backend codex --json --strict

echo "[smoke] One-shot run via claude"
node dist/bin/codexclaw.js run "Reply with exactly OK" --backend claude --json --strict

echo "[smoke] Starting web server"
node dist/bin/codexclaw.js web > /tmp/codexclaw-web.log 2>&1 &
WEB_PID=$!
cleanup() {
  kill "$WEB_PID" >/dev/null 2>&1 || true
}
trap cleanup EXIT
sleep 2

echo "[smoke] API health"
curl -sf http://127.0.0.1:3180/api/health | sed -n '1,80p'

echo "[smoke] API chat"
curl -sf -X POST http://127.0.0.1:3180/api/chat \
  -H 'Content-Type: application/json' \
  -d '{"prompt":"Reply with exactly OK","backend":"auto","strict":true}' | sed -n '1,120p'

echo "[smoke] Completed"
