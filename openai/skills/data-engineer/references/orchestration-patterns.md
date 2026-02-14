# Orchestration Patterns

Use this guide to design reliable data workflow orchestration.

## DAG Design

Keep workflows explicit:
- Separate ingest, transform, publish stages
- Keep task boundaries aligned with retry safety
- Encode dependencies directly, avoid implicit ordering
- Use data-ready checks where upstream timing is variable

## Retry and Backoff

Recommended defaults:
- Retry transient failures with exponential backoff + jitter
- Cap retries to avoid indefinite backlog growth
- Route terminal failures to error sink or incident queue

Define per task:
- Retryable vs non-retryable errors
- Max attempts
- Timeout policy

## Concurrency and Resource Controls

Protect shared infrastructure:
- Concurrency pools for heavy tasks
- Priority tiers for critical pipelines
- Runtime and memory guards to prevent noisy-neighbor impact

## Late Data and Reprocessing

Plan for delayed corrections:
- Watermark strategy for late arrivals
- Reprocessing windows for correction
- Idempotent merge logic for replayed events

## SLA-Aware Scheduling

Align schedule with freshness targets:
- Event-driven triggers for low-latency needs
- Time-based batches for cost-sensitive workloads
- Alert when predicted completion violates freshness SLO

## Operational Ownership

For each pipeline define:
- Primary owner
- Secondary/on-call owner
- Escalation path
- Runbook location and emergency actions
