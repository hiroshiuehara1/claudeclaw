# PR Title
feat(obsnote): cloud note app with admin controls, tests, coverage gates, and CI/audit automation

## Summary
- Built a cloud-based note application backend/frontend baseline:
  - user auth and forced password reset flow
  - admin account features (create users, monitor activity)
  - per-user private notes and folders
  - note version history and restore
  - search endpoint and UI integration
- Added comprehensive integration tests and coverage enforcement.
- Added CI and security workflows in GitHub Actions.
- Added production-focused audit policy (`moderate+` fail threshold for production deps).

## Commit Breakdown
1. `7433c90` - `feat(obsnote): build app with tests and coverage quality gates`
- Core app implementation under `obsnote/server`, `obsnote/client`, `obsnote/infra`
- Integration test suite (`12` tests across `5` files)
- Coverage configuration and thresholds
- Local audit scripts and docs updates

2. `aeb3c59` - `chore(obsnote): add CI and security audit automation workflows`
- CI workflow for test and coverage
- Weekly/manual security audit workflow
- Dependabot weekly npm updates for `/server`

## Validation
Executed locally:
- `npm test` -> passed
- `npm run test:coverage` -> passed
  - Statements/Lines: ~91%
  - Functions: ~88%
  - Branches: ~72%
- `npm run audit:report` + `npm run audit:check` -> passed (`0` production vulnerabilities at `moderate+`)
- `npm run audit:report:all` -> generated full dev+prod advisory report for visibility

## Notes
- Security gate is intentionally strict for production dependencies (`--omit=dev`).
- Dev-tooling advisories are captured in full audit output without blocking deployment.

## Suggested Reviewer Focus
- Auth/session security behavior (`refresh`, logout, forced reset)
- Admin RBAC and activity logging boundaries
- CI/audit workflow behavior and policy thresholds

