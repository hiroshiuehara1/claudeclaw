---
name: data-engineer
description: Production data engineering workflow for data pipeline design, dbt model and warehouse planning, data quality and lineage, schema evolution and backfill strategy, and implementation-ready data engineering plans.
---

# Data Engineer

Use this skill for production data lifecycle engineering.
Focus on practical data pipeline and modeling decisions that are safe to operate at scale.

## Workflow Contract

Follow this sequence unless the user explicitly asks for one-shot output:
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

Use `references/workflow.md` for stage details and decision tables.

## Clarification Rules

In guided mode, ask 4 to 8 high-value questions before proposing the final plan. Cover:
- Business goals and critical metrics
- Source systems, ownership, and data arrival patterns
- Freshness/SLA targets and data consumers
- Data volume growth and cost constraints
- Contract and schema compatibility requirements
- Quality expectations and reconciliation requirements
- Operational constraints (team, timeline, compliance)

If the user declines clarification, state explicit assumptions and continue.

## Default Assumptions

When inputs are partial, assume:
- ELT pattern with warehouse as system of analytics record
- dbt for transformations and model contracts
- Airflow-style orchestration for scheduled dependencies
- Partitioned incremental pipelines where feasible
- Data quality tests at source, transform, and serving layers

State assumptions clearly and invite corrections.

## Output Modes

Use guided mode by default:
- Ask clarifying questions
- Confirm constraints and assumptions
- Proceed through workflow gates in order

Support one-shot mode when requested:
- Keep all mandatory sections
- Put unknown inputs into explicit assumptions
- Keep quality, schema evolution, and cutover details concrete

Use `references/templates.md` for response skeletons.

## Boundary From Other Skills

This skill is not interview coaching. For interview prep or mock interview framing, prefer `system-design-interview`.
This skill is not general service architecture planning. For broader service architecture, SLO, and platform reliability topics outside data workflows, prefer `systems-engineer`.

## Quality Bar

Do not present a final answer unless all are present:
- Problem, scope, and consumers are explicit
- Source inventory and freshness/SLA requirements are explicit
- Volume/performance/cost estimates are explicit
- Ingestion and orchestration design is explicit
- Model layering and ownership are explicit
- Data contracts and schema evolution policy are explicit
- Data quality and reconciliation strategy are explicit
- Lineage/observability/operations are explicit
- Backfill/cutover/rollback strategy is explicit
- Validation gates and acceptance criteria are explicit

Use:
- `references/checklists.md` for quality gates
- `references/capacity-formulas.md` for estimation math
- `references/data-quality.md` for testing and incident handling
- `references/schema-evolution.md` for compatibility and migration policy
- `references/backfill-cutover.md` for replay and cutover safety
- `references/orchestration-patterns.md` for DAG and dependency patterns
