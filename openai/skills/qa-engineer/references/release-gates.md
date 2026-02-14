# Release Gates

Use this guide to make release decisions objective and auditable.

## Entry and Exit Criteria

Define stage-specific gates (for example):
- Entry to release candidate: smoke pass, critical defects triaged
- Exit to production: critical-path tests pass, blocking defects resolved, residual risk approved

## Blocking Thresholds

Define measurable thresholds:
- Maximum open Sev1/Sev2 defects
- Minimum pass rate for blocking suites
- Maximum acceptable flake rate in blocking suites
- Non-functional thresholds (latency/error/failure tolerances) where relevant

## Go/No-Go Decision Model

At decision time, include:
- Gate status summary (pass/fail)
- Residual risks and owner sign-off
- Rollback readiness confirmation

## Residual Risk Acceptance

If releasing with known gaps, document:
- Explicit risk statement
- Business owner/engineering owner approval
- Monitoring and mitigation plan post-release

## Post-Release Validation Window

Define stabilization period checks:
- Early defect trend and escape rate
- Error or failure telemetry for changed areas
- Trigger conditions for rollback or hotfix
