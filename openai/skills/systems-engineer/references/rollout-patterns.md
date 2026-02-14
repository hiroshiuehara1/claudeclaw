# Rollout Patterns

Use this reference to pick and operationalize deployment strategies.

## Strategy Selection

Choose based on risk and reversibility:
- Canary: best for progressive risk reduction and metric-based gating
- Blue/green: best for rapid cutover and rollback when state coupling is limited
- Shadow: best for validating behavior under real traffic without user impact
- Feature flags: best for user-segment and capability control

## Canary Pattern

Recommended defaults:
- Stage progression: 1% -> 5% -> 25% -> 50% -> 100%
- Hold time at each stage long enough to observe peak-like behavior
- Gate on error rate, latency, saturation, and business KPI regressions

Rollback triggers:
- Error rate above threshold
- SLO burn rate alert
- Data correctness or integrity anomalies

## Blue/Green Pattern

Use when full environment duplication is feasible.

Checklist:
- Validate green with smoke/load tests before cutover
- Ensure backward-compatible data paths
- Keep old environment warm for fast fallback window

## Shadow Pattern

Use when behavior validation matters more than immediate user impact.

Checklist:
- Mirror representative traffic
- Compare response correctness and latency
- Prevent side effects in shadow path

## Feature Flag Pattern

Use for fine-grained control:
- Target by user segment, geography, or tenant
- Define kill switch behavior
- Audit flag lifecycle and cleanup

## Data Migration Safety

Prefer expand/contract:
1. Expand schema (backward compatible)
2. Dual-write or backfill
3. Read switch with verification
4. Contract old schema after stability window

Always define:
- Compatibility window
- Backfill verification metrics
- Rollback behavior for partial migrations

## Rollout Communication and Ownership

Before rollout:
- Assign on-call owner and approver
- Publish change window and expected impact
- Prepare rollback command sequence and decision thresholds

After rollout:
- Confirm stabilization period metrics
- Capture deviations and follow-up actions
