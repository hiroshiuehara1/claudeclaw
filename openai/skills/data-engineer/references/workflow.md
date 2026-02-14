# Workflow

## Sequence

Run the production data engineering flow in this order:
1. Context, consumers, and latency goals gate
2. Source inventory and event contract ownership gate
3. Event semantics and freshness/SLA gate
4. Volume, state, performance, and cost estimates
5. Ingestion topology and orchestration design
6. Processing and model layering design
7. Data contracts and schema evolution strategy
8. Data quality and reconciliation strategy
9. Streaming operations and observability plan
10. Backfill, replay, cutover, and rollback plan
11. Validation and acceptance gates
12. Final Data Plan Bundle

Do not reorder unless the user explicitly requests a different sequence.

## Stage 1: Context, Consumers, and Latency Goals Gate

### Entry criteria
- User asks for data pipeline/model design, real-time analytics planning, or data reliability guidance.

### Exit criteria
- Problem statement is explicit.
- Primary consumers and decisions are explicit.
- In-scope and out-of-scope boundaries are explicit.
- Latency class target is explicit (for example sub-second, near-real-time, hourly).

## Stage 2: Source Inventory and Event Contract Ownership Gate

### Entry criteria
- Context is defined.

### Exit criteria
- Source systems and owners are listed.
- Event/entity contracts and version owners are listed.
- Mutation behavior and correction paths are documented.

## Stage 3: Event Semantics and Freshness/SLA Gate

### Entry criteria
- Source and contract inventory are available.

### Exit criteria
- Event-time vs processing-time semantics are explicit.
- Ordering guarantees and duplication assumptions are explicit.
- Lateness profile and watermark strategy are explicit.
- Freshness and latency SLO targets are explicit.

Use `event-semantics.md`.

## Stage 4: Volume, State, Performance, and Cost Estimates

### Entry criteria
- Semantics and SLO baseline are known or assumed.

### Exit criteria
- Throughput and peak burst estimates are provided.
- State growth and retention estimates are provided.
- Backlog recovery and lag drain feasibility are provided.
- Cost drivers and headroom are documented.

Use `capacity-formulas.md`.

## Stage 5: Ingestion Topology and Orchestration Design

### Entry criteria
- Scale and SLO baseline exists.

### Exit criteria
- Ingestion mode chosen (stream, micro-batch, batch, CDC).
- Topology and dependency boundaries identified.
- Retry/backoff/checkpoint/concurrency policies defined.

Use `orchestration-patterns.md`.

## Stage 6: Processing and Model Layering Design

### Entry criteria
- Ingestion topology exists.

### Exit criteria
- Layering model is defined (raw/staging/intermediate/marts/serving).
- Stateful processing boundaries are explicit.
- Incremental/recomputation strategy is explicit.

## Stage 7: Data Contracts and Schema Evolution Strategy

### Entry criteria
- Model layers and consumers are known.

### Exit criteria
- Contracts for critical datasets/events are documented.
- Compatibility policy and versioning approach are defined.
- Breaking-change mitigation and migration plan are defined.

Use `schema-evolution.md`.

## Stage 8: Data Quality and Reconciliation Strategy

### Entry criteria
- Contracts and schema policy are defined.

### Exit criteria
- Test suite includes freshness, null, uniqueness, referential, domain checks.
- Streaming-specific checks include duplicate and out-of-order handling.
- Reconciliation and drift escalation paths are defined.

Use `data-quality.md`.

## Stage 9: Streaming Operations and Observability Plan

### Entry criteria
- Data quality and pipeline design are defined.

### Exit criteria
- Lag, watermark lag, error rate, and throughput telemetry are defined.
- Checkpoint/state health and skew telemetry are defined.
- On-call ownership and response thresholds are documented.

Use `streaming-ops.md`.

## Stage 10: Backfill, Replay, Cutover, and Rollback Plan

### Entry criteria
- Pipeline and operations model is stable.

### Exit criteria
- Replay boundaries and idempotency strategy are explicit.
- Cutover sequence and acceptance checkpoints are explicit.
- Rollback triggers and fallback process are explicit.

Use `backfill-cutover.md`.

## Stage 11: Validation and Acceptance Gates

### Entry criteria
- Cutover and rollback plan is defined.

### Exit criteria
- Validation covers correctness, freshness, latency, and recovery behavior.
- Release gates and success criteria are explicit.
- Post-launch monitoring window and incident thresholds are explicit.

## Stage 12: Final Data Plan Bundle

### Entry criteria
- Stages 1 through 11 are complete.

### Exit criteria
- Final response includes all required sections from `templates.md` and passes `checklists.md`.

## Decision Table: Ingestion Mode

| Signal | Default choice | Alternative | Tradeoff focus |
|---|---|---|---|
| Sub-minute latency with continuous events | Streaming | Micro-batch | Latency vs operational overhead |
| Near-real-time with moderate variability | Micro-batch | Streaming | Simplicity vs latency |
| Cost-sensitive low-frequency updates | Batch/CDC snapshot | Streaming | Cost efficiency vs freshness |

## Decision Table: Delivery and Processing Guarantees

| Signal | Default choice | Alternative | Tradeoff focus |
|---|---|---|---|
| Financial or strict correctness use case | Idempotent exactly-once effect | At-least-once + dedupe | Correctness rigor vs implementation complexity |
| High throughput and tolerant consumers | At-least-once + dedupe windows | Exactly-once semantics | Throughput/cost vs strict guarantees |
| Unstable producer behavior | Contract guardrails + quarantine | Fail-fast reject | Availability vs strictness |

## Decision Table: Watermark and Lateness

| Signal | Default choice | Alternative | Tradeoff focus |
|---|---|---|---|
| Predictable late arrival profile | Fixed watermark lag | Dynamic watermarking | Simplicity vs adaptivity |
| Highly bursty/irregular late events | Adaptive watermark + corrections | Large fixed lag | Timeliness vs correction overhead |
| Critical low-latency output | Tight watermark + correction stream | Wide watermark | Latency vs completeness |

## Decision Table: State and Checkpointing

| Signal | Default choice | Alternative | Tradeoff focus |
|---|---|---|---|
| High-cardinality keys with long windows | Externalized state + TTL policy | In-memory local state | Durability vs speed |
| Strict recovery requirements | Frequent checkpoints | Sparse checkpoints | Recovery speed vs runtime overhead |
| Partition skew risk | Repartition + hot-key mitigation | Static partitioning | Stability vs implementation effort |
