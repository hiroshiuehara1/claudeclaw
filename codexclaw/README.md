# CodexClaw

Local-first assistant that routes prompts through local `codex` and `claude` commands with reliability and safety controls.

## Features

- Dual backend routing: `codex`, `claude`, or `auto` fallback
- Streaming responses in CLI and WebSocket API
- SQLite-backed sessions and message history
- Circuit breaker + retry + timeout safeguards
- Browser UI with session browsing

## Requirements

- Node.js 20+
- `codex` CLI installed and authenticated
- `claude` CLI installed and authenticated

## Install

```bash
npm install
cp .env.example .env
npm run build
```

## Run

```bash
# Interactive CLI
npx codexclaw chat --backend auto

# One-shot
npx codexclaw run "summarize this repo" --backend codex

# JSON output
npx codexclaw run "health check" --json

# Strict one-shot normalization (clean final answer only)
npx codexclaw run "Reply with exactly OK" --backend codex --json --strict

# Environment and backend readiness checks
npx codexclaw doctor
npx codexclaw doctor --json
npx codexclaw doctor --no-write-check

# Web server
npx codexclaw web
# Open http://127.0.0.1:3180
```

## API

- `GET /api/health`
- `GET /api/sessions`
- `GET /api/sessions/:id/messages`
- `POST /api/chat` (JSON or SSE with `Accept: text/event-stream`)
- `WS /api/chat/ws`

WebSocket payload:

```json
{ "prompt": "hello", "backend": "auto", "sessionId": "optional", "strict": true }
```

## Development

```bash
npm run dev
npm run lint
npm test
```

## Smoke Test

```bash
bash scripts/smoke.sh
```

## CI

- Workflow file: `.github/workflows/codexclaw-ci.yml`
- Push/PR on `codexclaw/**`: runs `npm ci`, `npm run lint`, `npm test`
- Optional smoke job: trigger `codexclaw-ci` via **workflow_dispatch** with `run_smoke=true`
  - Smoke requires `codex` and `claude` CLIs on the runner; job will skip smoke if missing.
