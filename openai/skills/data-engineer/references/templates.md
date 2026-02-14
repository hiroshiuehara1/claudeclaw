# Templates

Use these templates to keep output consistent and implementation-ready.

## Template A: Clarifying Questions (Guided Mode)

```markdown
Before proposing the plan, I need to lock key data constraints:
1. [Business decision or metric this pipeline supports]
2. [Source systems, event ownership, and mutation behavior]
3. [Event-time vs processing-time expectations]
4. [Freshness/latency SLO and acceptable lag]
5. [Lateness, out-of-order, and duplicate behavior]
6. [Schema change and consumer compatibility needs]
7. [Operational constraints: timeline, team, budget, compliance]

If any input is unknown, I will proceed with explicit assumptions.
```

## Template B: Assumptions (When Inputs Are Missing)

```markdown
Assumptions:
1. [Business and consumer assumptions]
2. [Source and event contract assumptions]
3. [Latency, event semantics, and correctness assumptions]
4. [Schema/contract assumptions]
5. [Operational and compliance assumptions]
```

## Template C: Source, Topology, and Data Flow Map

```markdown
Data flow map:
1. Source systems/events -> [ingestion pattern]
2. Raw/landing -> [storage or stream topic policy]
3. Processing layers -> [stateful/stateless strategy]
4. Serving marts/data products -> [consumer interfaces]

Critical dependencies:
- [Upstream dependency] -> [downstream impact]
- [Upstream dependency] -> [downstream impact]
```

## Template D: Event Semantics and SLA Budget

```markdown
Event semantics:
- Event-time field and ownership:
- Ordering guarantee assumptions:
- Duplicate/correction behavior:
- Lateness profile and watermark strategy:

Latency/freshness budget:
- Source to ingest:
- Ingest to process:
- Process to serve:
- End-to-end target and alert threshold:
```

## Template E: Capacity, State, Performance, and Cost

```markdown
Capacity/state/performance/cost estimates:
- Daily records/events and peak ingress rate:
- Average and peak processing throughput:
- State size growth and retention footprint:
- Consumer lag threshold and drain-time estimate:
- Runtime envelope and checkpoint overhead:
- Primary cost drivers: [stream compute, storage, scan, egress]
- Headroom target:
```

## Template F: Ingestion and Orchestration Plan

```markdown
Ingestion plan:
- Pattern: [stream | micro-batch | batch | CDC]
- Update semantics: [append | upsert | delete handling]
- Delivery guarantees: [at-least-once | effectively exactly-once]
- Failure handling: [retry/backoff/dead-letter/quarantine]

Orchestration plan:
- Topology stages and dependencies:
- Triggering/scheduling model:
- Concurrency and resource limits:
- Checkpointing and recovery controls:
```

## Template G: Processing, Contracts, and Schema Evolution

```markdown
Model layering:
- Raw:
- Staging:
- Intermediate:
- Marts/Serving:

Data/event contracts:
- [Dataset/Event]: [required fields, constraints, owner, consumers]
- [Dataset/Event]: [required fields, constraints, owner, consumers]

Schema evolution policy:
- Versioning strategy:
- Compatibility guarantees:
- Deprecation window:
- Consumer migration steps:
```

## Template H: Data Quality and Reconciliation Plan

```markdown
Data quality tests:
- Freshness checks:
- Null/uniqueness checks:
- Referential integrity checks:
- Accepted-value/domain checks:
- Duplicate/out-of-order handling checks:

Reconciliation:
- Source vs destination row/aggregate checks:
- Windowed metric-level reconciliation checks:
- Drift thresholds and escalation:

Incident handling:
- Severity mapping:
- Owner and escalation path:
```

## Template I: Streaming Operations and Observability

```markdown
Operations and observability:
- Lag and watermark lag metrics:
- Throughput, error, and retry metrics:
- Checkpoint/state health metrics:
- Partition skew/hot-key metrics:
- Alert policy and on-call ownership:

Operational controls:
- Replay/reprocessing workflow:
- Manual override/break-glass process:
- Cost guardrails and auto-scaling limits:
```

## Template J: Backfill, Replay, Cutover, and Rollback

```markdown
Backfill/replay strategy:
- Scope and replay boundaries:
- Idempotency and dedupe strategy:
- Runtime and resource estimate:

Cutover plan:
- Stage-by-stage sequence:
- Validation checkpoints:
- Go/no-go criteria:

Rollback plan:
- Trigger conditions:
- Rollback steps:
- Data consistency safeguards:
```

## Template K: Validation and Acceptance

```markdown
Validation plan:
- Pre-launch checks:
- Parallel-run checks:
- Post-cutover checks:
- Recovery and lag-drain checks:
- Monitoring stabilization window:

Acceptance criteria:
1. [Criterion]
2. [Criterion]
3. [Criterion]
```

## Template L: Final Data Plan Bundle

```markdown
Final Data Plan Bundle:
1. Problem statement and data product goals
2. Assumptions and constraints
3. Source/event contracts and ownership
4. Event semantics and freshness/latency model
5. Volume/state/performance/cost estimates
6. Ingestion topology and orchestration plan
7. Processing/modeling and serving plan
8. Data quality and reconciliation plan
9. Schema evolution and compatibility plan
10. Streaming operations and observability plan
11. Backfill/replay/cutover/rollback strategy
12. Validation gates and acceptance criteria
13. Open risks, residual risk owners, and follow-up actions
```

## Template M: One-Shot Mode

Use this when the user asks for a complete answer immediately.

```markdown
I will provide a full production data engineering package. Inputs are partial, so I will state assumptions first.

## Assumptions
[Template B]

## Source/Topology and Event Semantics
[Template C + Template D]

## Capacity, State, Performance, and Cost
[Template E]

## Ingestion and Orchestration
[Template F]

## Processing, Contracts, and Schema Evolution
[Template G]

## Data Quality and Reconciliation
[Template H]

## Streaming Operations
[Template I]

## Backfill, Replay, Cutover, and Rollback
[Template J]

## Validation and Acceptance
[Template K]

## Final Data Plan Bundle
[Template L condensed]
```
