# Streaming Operations

Use this guide for operational reliability of streaming systems.

## Core Operational Metrics

Track at minimum:
- Ingress rate and processing rate
- Consumer lag and lag growth rate
- Watermark lag
- Error/retry rates
- Checkpoint age and checkpoint failure rate
- State size growth and hot-key skew signals

## Alerting Baseline

Define alert thresholds for:
- Lag above SLO threshold
- Watermark lag above correctness threshold
- Checkpoint failures or stale checkpoints
- Error-rate spikes and dead-letter growth

Each alert must include owner and escalation path.

## Runbook Essentials

For each critical stream include:
- Immediate triage steps
- Safe restart/recovery steps
- Replay/catch-up workflow
- Rollback or traffic-shift criteria

## Incident Patterns

Prepare for common incidents:
- Producer schema drift
- Partition skew or hot keys
- Downstream sink saturation
- Checkpoint corruption or recovery failures

For each pattern, define containment and recovery actions.

## Recovery Objectives

Document objective targets:
- Maximum acceptable lag
- Target lag-drain time
- Maximum tolerated data loss/duplication behavior
- Verification checkpoints before incident closure
