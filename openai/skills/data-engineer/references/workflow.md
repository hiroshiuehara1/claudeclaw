# Workflow

## Sequence

Run the production data engineering flow in this order:
1. Context and business metric gate
2. Source inventory and freshness/SLA gate
3. Volume, performance, and cost estimates
4. Ingestion and orchestration design
5. Transformation and model layering design
6. Data contracts and schema evolution strategy
7. Data quality and reconciliation strategy
8. Lineage, observability, and operations
9. Backfill, cutover, and rollback plan
10. Validation and acceptance gates
11. Final Data Plan Bundle

Do not reorder unless the user explicitly requests a different sequence.

## Stage 1: Context and Business Metric Gate

### Entry criteria
- User asks for pipeline/model design, data reliability, or data workflow planning.

### Exit criteria
- Problem statement is explicit.
- Primary consumers and decisions are explicit.
- In-scope and out-of-scope boundaries are explicit.

## Stage 2: Source Inventory and Freshness/SLA Gate

### Entry criteria
- Context is defined.

### Exit criteria
- Source systems and ownership are listed.
- Arrival pattern and latency expectations are documented.
- Freshness/SLA targets are documented.

## Stage 3: Volume, Performance, and Cost Estimates

### Entry criteria
- Source inventory is known or assumed.

### Exit criteria
- Daily and peak volume estimates are provided.
- Runtime and resource envelope estimates are provided.
- Storage growth and retention footprint are provided.
- Cost drivers and headroom are documented.

Use `capacity-formulas.md`.

## Stage 4: Ingestion and Orchestration Design

### Entry criteria
- Volume and SLA baseline exists.

### Exit criteria
- Ingestion approach chosen (batch/stream/CDC/snapshot).
- Orchestration DAG and dependencies identified.
- Retry/backoff/concurrency policies defined.

Use `orchestration-patterns.md`.

## Stage 5: Transformation and Model Layering Design

### Entry criteria
- Ingestion plan exists.

### Exit criteria
- Layering model defined (raw/staging/intermediate/marts).
- Incremental/full-refresh strategy defined.
- Ownership and change policy defined.

## Stage 6: Data Contracts and Schema Evolution Strategy

### Entry criteria
- Model layers and consumers are known.

### Exit criteria
- Data contracts are documented for critical datasets.
- Compatibility policy and versioning approach are defined.
- Breaking-change mitigation and consumer migration plan are defined.

Use `schema-evolution.md`.

## Stage 7: Data Quality and Reconciliation Strategy

### Entry criteria
- Contracts and schema policy are defined.

### Exit criteria
- Test suite includes freshness, null, uniqueness, referential, accepted values.
- Reconciliation strategy is defined for key metrics.
- Escalation path and severity mapping are defined.

Use `data-quality.md`.

## Stage 8: Lineage, Observability, and Operations

### Entry criteria
- Data quality strategy exists.

### Exit criteria
- Lineage expectations are defined for critical assets.
- Operational telemetry (run success, latency, data drift) is defined.
- Ownership and on-call path are documented.

## Stage 9: Backfill, Cutover, and Rollback Plan

### Entry criteria
- Pipeline/model design is stable.

### Exit criteria
- Backfill strategy is selected and runtime estimated.
- Cutover sequence and acceptance checkpoints are defined.
- Rollback triggers and fallback process are explicit.

Use `backfill-cutover.md`.

## Stage 10: Validation and Acceptance Gates

### Entry criteria
- Cutover and rollback plan is defined.

### Exit criteria
- Validation plan covers data correctness, freshness, and performance.
- Release gates and success criteria are explicit.
- Post-launch monitoring window is defined.

## Stage 11: Final Data Plan Bundle

### Entry criteria
- Stages 1 through 10 are complete.

### Exit criteria
- Final response includes all required sections from `templates.md` and passes `checklists.md`.

## Decision Table: Ingestion

| Signal | Default choice | Alternative | Tradeoff focus |
|---|---|---|---|
| Source emits change stream | CDC | Periodic snapshot | Freshness vs operational complexity |
| Low update frequency, simple extract | Batch snapshot | CDC | Simplicity vs staleness |
| Near-real-time consumer needs | Streaming | Micro-batch | Latency vs cost/control |

## Decision Table: Transform Strategy

| Signal | Default choice | Alternative | Tradeoff focus |
|---|---|---|---|
| Large mutable tables | Incremental + merge | Full refresh | Runtime/cost vs logic complexity |
| Small stable dimensions | Full refresh | Incremental | Simplicity vs compute overhead |
| Late-arriving facts | Watermark + reprocessing window | Strict append-only | Correctness vs simplicity |

## Decision Table: Partitioning and Storage

| Signal | Default choice | Alternative | Tradeoff focus |
|---|---|---|---|
| Time-series queries dominate | Date partitioning | Hash partitioning | Scan pruning vs skew risk |
| High-cardinality tenant access | Tenant + date composite | Date only | Isolation vs small-file risk |
| Frequent point lookups | Clustering/sort keys | No clustering | Performance vs maintenance cost |

## Decision Table: Orchestration

| Signal | Default choice | Alternative | Tradeoff focus |
|---|---|---|---|
| Strict task dependencies | DAG scheduler | Event-driven chains | Predictability vs flexibility |
| Bursty failures | Exponential backoff retries | Fixed retries | Recovery rate vs prolonged lag |
| Shared cluster constraints | Concurrency caps + pools | Unlimited parallelism | Stability vs throughput |
