# Workflow

## Sequence

Run the production engineering flow in this order:
1. Context gate
2. Constraints and SLO gate
3. Capacity and performance estimates
4. Architecture and dependency mapping
5. Interfaces and data contracts
6. Reliability and failure-mode analysis
7. Security and compliance review
8. Rollout, rollback, and migration plan
9. Validation and success criteria
10. Final Design Spec Bundle

Do not reorder unless the user explicitly requests a different sequence.

## Stage 1: Context Gate

### Entry criteria
- User asks for architecture review, system change planning, or production design guidance.

### Exit criteria
- Problem statement is explicit.
- In-scope and out-of-scope boundaries are explicit.
- Primary stakeholders and workloads are identified.

## Stage 2: Constraints and SLO Gate

### Entry criteria
- Context and scope are defined.

### Exit criteria
- SLO targets documented (latency, availability, durability).
- Business and engineering constraints documented (budget, team, timeline, dependencies).
- Consistency and correctness requirements documented.

## Stage 3: Capacity and Performance Estimates

### Entry criteria
- SLO and constraints are known or assumed.

### Exit criteria
- MAU/DAU assumptions listed.
- Average and peak throughput estimated.
- Storage growth and retention footprint estimated.
- Bandwidth estimate provided.
- Headroom multiplier stated.

Use `capacity-formulas.md` for formulas.

## Stage 4: Architecture and Dependency Mapping

### Entry criteria
- Capacity baseline exists.

### Exit criteria
- Core components identified.
- Read and write paths explained.
- Internal and external dependencies listed.
- Region/zone layout and failure domains stated.

## Stage 5: Interfaces and Data Contracts

### Entry criteria
- Architecture shape agreed.

### Exit criteria
- Core entities listed with key fields.
- Key APIs/events listed with purpose and constraints.
- Idempotency, pagination, versioning, and schema evolution policy addressed where relevant.

## Stage 6: Reliability and Failure-Mode Analysis

### Entry criteria
- Interfaces and dependencies are defined.

### Exit criteria
- At least 3 concrete failure modes identified.
- Detection and mitigation per failure mode documented.
- Backpressure, retry, timeout, and circuit-breaker policies covered.
- Error budget implications noted.

Use `reliability-playbook.md`.

## Stage 7: Security and Compliance Review

### Entry criteria
- System boundaries and data flows are known.

### Exit criteria
- Data classification and trust boundaries documented.
- Authn/authz model stated.
- Encryption, secret handling, and audit requirements covered.
- Retention/deletion obligations captured.

Use `security-compliance.md`.

## Stage 8: Rollout, Rollback, and Migration Plan

### Entry criteria
- Design and controls are defined.

### Exit criteria
- Rollout strategy selected (canary, blue/green, shadow, flag-based).
- Rollback triggers and rollback steps defined.
- Data migration safety plan defined (expand/contract or equivalent).
- Operational ownership and communication path identified.

Use `rollout-patterns.md`.

## Stage 9: Validation and Success Criteria

### Entry criteria
- Rollout strategy is defined.

### Exit criteria
- Test plan spans unit, integration, load, and failure injection where relevant.
- Observability plan includes metrics, logs, traces, and alerts.
- Acceptance criteria and release gates are explicit.

## Stage 10: Final Design Spec Bundle

### Entry criteria
- Stages 1 through 9 complete.

### Exit criteria
- Final response includes all required sections from `templates.md` and passes `checklists.md`.

## Decision Table: Storage

| Signal | Default choice | Alternative | Tradeoff focus |
|---|---|---|---|
| Strong transactions and relational queries | SQL | NoSQL | Consistency and joins vs horizontal simplicity |
| Massive key-based access and very high scale | NoSQL KV | SQL + sharding | Throughput vs query flexibility |
| Time-series heavy ingest | Time-series store | SQL partitioning | Write efficiency vs tooling simplicity |

## Decision Table: Caching

| Signal | Default choice | Alternative | Tradeoff focus |
|---|---|---|---|
| Read-heavy with repeated access | Read-through cache | Write-through cache | Freshness vs write complexity |
| Expensive aggregation queries | Materialized views/cache | On-demand compute | Staleness vs compute cost |
| Hot partition or key risk | Key-aware sharding + local cache | Global cache only | Operational complexity vs tail latency |

## Decision Table: Consistency

| Signal | Default choice | Alternative | Tradeoff focus |
|---|---|---|---|
| Financial or correctness-critical writes | Strong consistency | Eventual consistency | Correctness vs latency |
| Social/feed style fan-out | Eventual consistency | Strong consistency | Throughput and UX vs strict ordering |
| Multi-region writes | Region primary with conflict policy | Global serializability | Simplicity vs write latency |

## Decision Table: Async Backbone

| Signal | Default choice | Alternative | Tradeoff focus |
|---|---|---|---|
| Task execution with retries | Queue + worker pool | Stream processor | Simplicity vs replay/history |
| Ordered event replay needed | Stream/log | Queue | Ordering/replay vs consumer complexity |
| User path sensitive latency | Async fan-out | Inline sync | UX latency vs consistency timing |

## Decision Table: Multi-Region

| Signal | Default choice | Alternative | Tradeoff focus |
|---|---|---|---|
| Strict data residency | Region-local storage and compute | Global shared plane | Compliance vs operability |
| Global low-latency reads | Multi-region read replicas | Single-region primary | Latency vs consistency complexity |
| Disaster tolerance requirements | Active-passive failover | Active-active | Lower complexity vs higher write complexity |
