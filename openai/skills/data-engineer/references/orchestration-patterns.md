# Orchestration Patterns

Use this guide to design reliable orchestration for streaming-first hybrid data systems.

## Topology Design

Keep workflows explicit:
- Separate ingest, process, and serve boundaries
- Isolate streaming and batch responsibilities where needed
- Encode dependencies directly and avoid implicit ordering
- Use data-ready and watermark-ready checks when timing is variable

## Stream Job Lifecycle

For long-running jobs, define:
- Deploy strategy (rolling/canary/parallel)
- Checkpoint cadence and retention policy
- Restart behavior and replay bounds
- Rollback path and safety checks

## Retry and Backoff

Recommended defaults:
- Retry transient failures with exponential backoff plus jitter
- Cap retries to avoid indefinite backlog growth
- Route terminal failures to dead-letter or incident queue

Define per stage:
- Retryable vs non-retryable errors
- Max attempts and timeout policy
- Escalation conditions

## Concurrency and Resource Controls

Protect shared infrastructure:
- Concurrency pools for heavy tasks and replays
- Priority tiers for low-latency critical pipelines
- Runtime and memory guards to prevent noisy-neighbor impact
- Backpressure controls and autoscaling boundaries

## Late Data and Replay

Plan explicitly for delayed corrections:
- Watermark strategy for late arrivals
- Reprocessing windows for corrections
- Idempotent merge logic for replayed events
- Replay throttling to preserve serving SLAs

## Consumer Group and Partition Operations

Include controls for:
- Rebalance impact mitigation
- Partition skew detection and re-sharding actions
- Hot-key mitigation and route isolation

## SLA-Aware Scheduling

Align schedule with freshness and latency targets:
- Event-driven triggers for low-latency needs
- Time-based batches for cost-sensitive workloads
- Alert when predicted completion or lag violates SLO

## Operational Ownership

For each pipeline define:
- Primary owner
- Secondary/on-call owner
- Escalation path
- Runbook location and emergency actions
