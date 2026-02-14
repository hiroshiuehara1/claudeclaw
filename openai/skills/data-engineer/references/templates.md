# Templates

Use these templates to keep output consistent and implementation-ready.

## Template A: Clarifying Questions (Guided Mode)

```markdown
Before proposing the plan, I need to lock key data constraints:
1. [Business decision or metric this pipeline supports]
2. [Source systems, ownership, and mutation behavior]
3. [Freshness/SLA and acceptable lag]
4. [Volume profile and growth expectations]
5. [Quality expectations and reconciliation requirements]
6. [Schema change expectations and consumer compatibility needs]
7. [Operational constraints: timeline, team, budget, compliance]

If any input is unknown, I will proceed with explicit assumptions.
```

## Template B: Assumptions (When Inputs Are Missing)

```markdown
Assumptions:
1. [Business and consumer assumptions]
2. [Source and ingestion assumptions]
3. [Freshness and performance assumptions]
4. [Schema/contract assumptions]
5. [Operational and compliance assumptions]
```

## Template C: Data Flow Map

```markdown
Data flow map:
1. Source systems -> [ingestion pattern]
2. Raw layer -> [storage pattern]
3. Staging/intermediate models -> [transformation strategy]
4. Serving marts/data products -> [consumer interfaces]

Critical dependencies:
- [Upstream dependency] -> [downstream impact]
- [Upstream dependency] -> [downstream impact]
```

## Template D: Capacity, Performance, and Cost

```markdown
Capacity/performance/cost estimates:
- Daily records/events: [value]
- Peak ingest rate: [value]
- Average and peak processing throughput: [formula -> value]
- Storage/day and retention footprint: [formula -> value]
- Runtime envelope per pipeline: [value]
- Primary cost drivers: [scan, compute, storage, egress]
- Headroom target: [for example 2x]
```

## Template E: Ingestion and Orchestration Plan

```markdown
Ingestion plan:
- Pattern: [batch | CDC | stream]
- Update semantics: [append | upsert | delete handling]
- Failure handling: [retry/backoff/dead-letter/quarantine]

Orchestration plan:
- DAG stages and dependencies:
- Scheduling/event triggers:
- Concurrency and resource limits:
- SLA enforcement and alert points:
```

## Template F: Model Contracts and Schema Evolution

```markdown
Model layering:
- Raw:
- Staging:
- Intermediate:
- Marts:

Data contracts:
- [Dataset]: [required fields, constraints, owner, consumers]
- [Dataset]: [required fields, constraints, owner, consumers]

Schema evolution policy:
- Versioning strategy:
- Compatibility guarantees:
- Deprecation window:
- Consumer migration steps:
```

## Template G: Data Quality and Reconciliation Plan

```markdown
Data quality tests:
- Freshness checks:
- Null/uniqueness checks:
- Referential integrity checks:
- Accepted-value/domain checks:

Reconciliation:
- Source vs warehouse row-count checks:
- Metric-level reconciliation checks:
- Drift thresholds and escalation:

Incident handling:
- Severity mapping:
- Owner and escalation path:
```

## Template H: Lineage, Observability, and Operations

```markdown
Lineage and observability:
- Critical asset lineage coverage:
- Pipeline runtime/failure metrics:
- Freshness and data quality dashboards:
- Alert policy and on-call ownership:

Operational controls:
- Reprocessing workflow:
- Manual override/break-glass process:
- Cost guardrails:
```

## Template I: Backfill, Cutover, and Rollback

```markdown
Backfill strategy:
- Scope and window:
- Replay pattern and idempotency:
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

## Template J: Validation and Acceptance

```markdown
Validation plan:
- Pre-launch checks:
- Parallel-run checks:
- Post-cutover checks:
- Monitoring stabilization window:

Acceptance criteria:
1. [Criterion]
2. [Criterion]
3. [Criterion]
```

## Template K: Final Data Plan Bundle

```markdown
Final Data Plan Bundle:
1. Problem statement and data product goals
2. Assumptions and constraints
3. Source inventory and freshness/SLA targets
4. Volume/performance/cost estimates
5. Ingestion and orchestration plan
6. Transformation/modeling plan
7. Data quality and reconciliation plan
8. Schema evolution and compatibility plan
9. Lineage/observability/operations plan
10. Backfill/cutover/rollback strategy
11. Validation gates and acceptance criteria
12. Open risks and follow-up actions
```

## Template L: One-Shot Mode

Use this when the user asks for a complete answer immediately.

```markdown
I will provide a full production data engineering package. Inputs are partial, so I will state assumptions first.

## Assumptions
[Template B]

## Data Flow
[Template C]

## Capacity, Performance, and Cost
[Template D]

## Ingestion and Orchestration
[Template E]

## Modeling, Contracts, and Schema Evolution
[Template F]

## Data Quality and Reconciliation
[Template G]

## Lineage and Operations
[Template H]

## Backfill, Cutover, and Rollback
[Template I]

## Validation and Acceptance
[Template J]

## Final Data Plan Bundle
[Template K condensed]
```
