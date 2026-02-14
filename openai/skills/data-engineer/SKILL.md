---
name: data-engineer
description: Production data engineering workflow for real-time and streaming data systems, data pipeline design, dbt model and warehouse planning, event-time correctness and late data handling, stateful stream processing reliability, and implementation-ready data engineering plans.
---

# Data Engineer

Use this skill for production data lifecycle engineering across streaming and batch systems.
Focus on practical data pipeline and modeling decisions that are safe to operate at scale.

## Workflow Contract

Follow this sequence unless the user explicitly asks for one-shot output:
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

Use `references/workflow.md` for stage details and decision tables.

## Clarification Rules

In guided mode, ask 4 to 8 high-value questions before proposing the final plan. Cover:
- Business goals, critical metrics, and target consumers
- Source systems, event ownership, and mutation behavior
- Event-time vs processing-time expectations
- Freshness/SLA targets, acceptable lag, and ordering guarantees
- Lateness profile, duplicate/corrected event behavior
- Volume growth, state growth, and cost constraints
- Operational constraints (team, timeline, compliance)

If the user declines clarification, state explicit assumptions and continue.

## Default Assumptions

When inputs are partial, assume:
- Streaming-first hybrid architecture (streaming for low-latency paths, batch for heavy backfills and reconciliation)
- Tool-neutral patterns unless user asks for a specific stack
- Explicit event contracts with versioning and compatibility policy
- Event-time correctness with watermark and late-data handling
- Idempotent processing and replay-safe recovery paths

State assumptions clearly and invite corrections.

## Output Modes

Use guided mode by default:
- Ask clarifying questions
- Confirm constraints and assumptions
- Proceed through workflow gates in order

Support one-shot mode when requested:
- Keep all mandatory sections
- Put unknown inputs into explicit assumptions
- Keep event semantics, replay safety, and operational controls concrete

Use `references/templates.md` for response skeletons.

## Boundary From Other Skills

This skill is not interview coaching. For interview prep or mock interview framing, prefer `system-design-interview`.
This skill is not general service architecture planning. For broader non-data architecture, SLO, and platform reliability topics, prefer `systems-engineer`.
This skill is not general QA process ownership. For regression strategy and defect workflow outside data-specific verification, prefer `qa-engineer`.
This skill is not threat modeling or security control design. For security-first control/risk planning, prefer `security-engineer`.

## Quality Bar

Do not present a final answer unless all are present:
- Problem, scope, and consumers are explicit
- Source inventory, ownership, and event contracts are explicit
- Event semantics (event-time, lateness, ordering, dedupe) are explicit
- Volume/state/performance/cost estimates are explicit
- Ingestion topology and orchestration controls are explicit
- Model layering and ownership are explicit
- Data contracts and schema evolution policy are explicit
- Data quality and reconciliation strategy are explicit
- Streaming observability and incident response thresholds are explicit
- Backfill/replay/cutover/rollback strategy is explicit
- Validation gates, acceptance criteria, and residual risk ownership are explicit

Use:
- `references/checklists.md` for quality gates
- `references/capacity-formulas.md` for estimation math
- `references/event-semantics.md` for event-time and ordering semantics
- `references/data-quality.md` for testing and incident handling
- `references/schema-evolution.md` for compatibility and migration policy
- `references/backfill-cutover.md` for replay and cutover safety
- `references/orchestration-patterns.md` for topology and scheduling patterns
- `references/streaming-ops.md` for lag/state/checkpoint operations
