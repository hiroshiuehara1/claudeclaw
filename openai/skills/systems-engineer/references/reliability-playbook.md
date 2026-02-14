# Reliability Playbook

Use this playbook during reliability and failure-mode analysis.

## SLI/SLO Baseline

Define user-facing indicators first:
- Availability SLI: successful requests / total requests
- Latency SLI: percentile latency for critical endpoints (p95/p99)
- Correctness SLI: successful correct outcomes for critical workflows
- Freshness SLI (if data staleness matters)

Define SLO targets with windows:
- Example: p95 latency < 250 ms over 30 days
- Example: availability >= 99.95% over 30 days

Track error budget:

```text
error_budget = 1 - slo_target
```

## Failure Mode Categories

Cover at least one mode in each category when relevant:
- Dependency failure: database/cache/queue/provider outage
- Saturation: CPU, memory, connection pool, IOPS, queue lag
- Data correctness: duplicate writes, ordering errors, schema mismatch
- Network and region events: packet loss, partition, region impairment
- Deployment and config regressions

## Mitigation Patterns

Use concrete controls:
- Timeouts and request budgets
- Retries with backoff and jitter
- Idempotency keys for write safety
- Circuit breakers and load shedding
- Bulkheads to isolate failure domains
- Queue dead-letter handling
- Graceful degradation for non-critical features

## Detection and Response

For each critical failure mode, define:
- Signal: metric/log/trace and threshold
- Alert route: ownership and escalation path
- Immediate mitigation: automated/manual steps
- Recovery confirmation: objective signal that service is healthy

## Reliability Design Questions

Ask these during review:
- What is the top source of p99 latency?
- Which dependency has highest correlated-failure risk?
- What fails open vs fails closed, and why?
- Can retries amplify load during incidents?
- Is there a tested rollback path for the latest change?

## 10x Evolution Guidance

State how reliability changes at 10x traffic:
- Partitioning/sharding plan
- Queue partition strategy and consumer scaling
- Hot-key mitigation strategy
- Cross-region failover posture
- Control plane and runbook maturity improvements
