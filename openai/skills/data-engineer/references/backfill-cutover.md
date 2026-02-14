# Backfill, Replay, Cutover, and Rollback

Use this guide for safe historical reprocessing and production cutovers in streaming-first hybrid systems.

## Backfill and Replay Strategy Selection

Choose based on volume, SLO, and risk:
- Full historical replay: simplest logic, highest runtime/cost
- Windowed replay: reduced risk, good for incremental validation
- Hybrid: bootstrap snapshot plus incremental replay

## Replay Safety Controls

Require:
- Idempotent writes or deterministic merge logic
- Replay boundary definition (time, offset, partition)
- Resource throttling to protect production workloads
- Checkpointing for resumable execution
- Dedupe strategy for duplicate events

## Stream/Batch Convergence Pattern

For hybrid systems, use staged convergence:
1. Run new path in shadow or parallel mode
2. Reconcile stream and batch outputs over target windows
3. Gate on correctness/freshness/latency thresholds
4. Cut over consumers progressively
5. Monitor stabilization window

## Cutover Sequence

Use staged cutover:
1. Prepare new topology and checkpoints
2. Validate replay and parity checkpoints
3. Shift reads/writes by segment or tenant
4. Confirm lag and quality guardrails
5. Complete cutover and monitor closely

## Rollback Triggers

Define objective triggers such as:
- Reconciliation variance above threshold
- Freshness/latency SLA breach sustained over threshold window
- Critical metric divergence beyond tolerance
- Persistent processing lag growth

## Rollback Actions

Define explicit actions:
- Revert consumers to prior dataset/model/path
- Halt new writes if consistency risk is high
- Restore previous route/checkpoint policy
- Log rollback event and initiate incident workflow

## Post-Cutover Validation

Confirm:
- Row-count and metric parity in target windows
- Freshness/latency SLO compliance restored
- Downstream consumer health stabilized
- Open corrective actions documented
