## Summary

- What changed:
- Why it changed:
- User-visible impact:

## Scope

- In scope:
- Out of scope:

## Validation Evidence

Paste command outputs or links (not screenshots only):

```bash
npm run lint
npm test
bash scripts/smoke.sh
```

## CodexClaw Checklist

- [ ] `npm run lint` passes.
- [ ] `npm test` passes.
- [ ] `bash scripts/smoke.sh` passes (or explain why not run).
- [ ] `codexclaw run --strict` returns clean final output for both `codex` and `claude`.
- [ ] `POST /api/chat` with `strict: true` returns normalized `text`.
- [ ] Strict SSE emits `response.start -> response.delta -> response.end`.
- [ ] Strict WebSocket emits `response.start -> response.delta -> response.end`.
- [ ] `codexclaw doctor` is healthy in dev environment (or `--no-write-check` used with reason).
- [ ] Docs were updated if behavior, commands, or API payload changed.
- [ ] Added/updated tests for changed behavior (especially strict-mode logic).

## API / Contract Changes

- [ ] No public API changes.
- [ ] Public API changed (describe endpoints/payloads/events and compatibility impact).

## Risks & Rollback

- Main risks:
- Rollback plan:

## UI Notes (if applicable)

- [ ] N/A
- [ ] Desktop tested
- [ ] Mobile tested
- Screenshots/GIFs:

## Related

- Issue / task:
- Follow-ups:
