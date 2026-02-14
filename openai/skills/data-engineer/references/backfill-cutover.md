# Backfill, Cutover, and Rollback

Use this guide for safe historical reprocessing and production cutovers.

## Backfill Strategy Selection

Choose based on volume, SLA, and risk:
- Full historical replay: simplest logic, high runtime/cost
- Windowed backfill: reduced risk, good for incremental validation
- Hybrid backfill: bootstrap snapshot plus incremental replay

## Backfill Safety Controls

Require:
- Idempotent writes or deterministic merge logic
- Partition/window boundaries clearly defined
- Resource throttling to protect production workloads
- Checkpointing for resumable execution

## Cutover Sequence

Use staged cutover:
1. Prepare new pipeline/model in shadow or parallel mode
2. Run reconciliation between old and new outputs
3. Gate on quality/freshness/performance thresholds
4. Switch consumer reads/writes
5. Monitor stabilization window

## Rollback Triggers

Define objective triggers such as:
- Reconciliation variance above threshold
- Freshness SLA breach sustained over threshold window
- Critical metric divergence beyond tolerance
- Persistent pipeline failure rate

## Rollback Actions

Define explicit actions:
- Revert consumers to prior dataset/model
- Halt new writes if consistency risk is high
- Restore previous schedule/route
- Log rollback event and initiate incident workflow

## Post-Cutover Validation

Confirm:
- Row-count and metric parity in target windows
- Freshness/SLA compliance restored
- Downstream consumer health stabilized
- Open corrective actions documented
