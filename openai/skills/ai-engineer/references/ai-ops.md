# AI Ops

Use this guide for operational reliability of AI features in production.

## Core Monitoring Signals

Track at minimum:
- Task success proxy metrics
- Refusal and escalation rate
- Citation/grounding adherence rate (when required)
- Latency percentiles
- Cost per request and token usage
- Retrieval hit quality and empty-context rate

## Alerting Baseline

Define alerts for:
- Quality regression beyond threshold
- Safety/refusal anomaly spikes
- Latency or error-rate SLO breach
- Cost spike anomalies
- Retrieval pipeline degradation

Each alert must include owner and escalation path.

## Incident Runbook Essentials

For each AI feature define:
- Immediate triage checks
- Safe rollback/fallback steps
- Policy-tightening emergency path
- Communication and stakeholder update path

## Change Management

For prompt/model/policy updates:
- Stage rollout progressively
- Monitor online deltas versus control baseline
- Auto-hold or rollback on threshold breach

## Post-Incident Loop

After incidents capture:
- Root cause category (prompt, retrieval, model, policy, tooling)
- Detection gap and time-to-detect
- Corrective actions and owner
- Regression checks added to prevent recurrence
