# Checklists

Use this file before delivering a final answer.

## Completeness Checklist

Mark each item as complete before finalizing:
- Problem statement, consumers, and data product goals are explicit
- Source/event inventory and ownership are explicit
- Event semantics (event-time, ordering, duplicates, lateness) are explicit
- Freshness/latency targets and lag thresholds are explicit
- Volume, state growth, runtime, and storage estimates are explicit
- Cost drivers and headroom assumptions are explicit
- Ingestion topology and orchestration dependencies are explicit
- Model layering and ownership are explicit
- Data contracts and schema evolution policy are explicit
- Data quality and reconciliation strategy are explicit
- Stream operations and observability strategy are explicit
- Backfill/replay/cutover/rollback strategy is explicit
- Validation gates and launch criteria are explicit
- Open risks, residual risk ownership, and follow-up actions are explicit

## Anti-Pattern Checklist

Reject or revise responses with these issues:
- "Real-time" design expressed only as cron batch steps
- Event-time semantics omitted for streaming use case
- Incremental logic without late/duplicate/corrected event handling
- Data quality listed as generic checks without thresholds
- Schema migration plan missing compatibility windows
- Replay planned without idempotency or dedupe policy
- Cutover proposed without rollback triggers
- No lag/runbook thresholds for streaming incidents
- Partition strategy omitted despite high-cardinality or skew risk
- Final answer missing validation gates

## Operational Readiness Gate

Deliver only when all are true:
- Correctness: contract, schema, and metric logic are internally consistent
- Reliability: retries, checkpoints, replay, and failure recovery are defined
- Operability: telemetry, alerts, ownership, and run actions are clear
- Scalability: path to 10x throughput/state is present
- Safety: cutover, rollback, and residual-risk controls are explicit

## Decision Sanity Checks

Run quick checks on major choices:
- Event semantics:
  - Is event-time vs processing-time behavior explicit?
  - Is lateness/watermark strategy aligned with SLOs?
- Ingestion and processing:
  - Does mode choice match latency and cost targets?
  - Are delivery guarantees compatible with correctness needs?
- State and recovery:
  - Is checkpoint/recovery policy explicit?
  - Is lag drain feasible under peak conditions?
- Data quality:
  - Are checks mapped to business-critical fields and metrics?
  - Are duplicate/out-of-order checks present?
- Schema evolution:
  - Is compatibility policy explicit?
  - Are consumer migration and deprecation windows defined?
- Rollout and replay:
  - Are cutover checkpoints measurable?
  - Are rollback triggers objective?

## Trigger Routing QA

Use these prompts to verify boundary behavior across skills.

| Prompt | Expected primary skill | Key signal |
|---|---|---|
| "Design event-time watermark strategy and late-data handling for a streaming metrics pipeline." | `data-engineer` | Streaming semantics and lateness controls |
| "Plan replay-safe backfill for corrected events without double counting." | `data-engineer` | Replay/idempotency data workflow |
| "Define contracts and schema evolution for stream consumers across versions." | `data-engineer` | Contract and compatibility policy |
| "Create lag and checkpoint runbooks for real-time ingestion." | `data-engineer` | Streaming operations |
| "Run a mock system design interview for URL shortener." | `system-design-interview` | Interview framing |
| "Review service architecture SLO and multi-region failover strategy." | `systems-engineer` | Broad service reliability architecture |
| "Build regression strategy and QA release criteria." | `qa-engineer` | General QA process focus |
| "Threat model this auth service and define controls." | `security-engineer` | Security control/risk focus |

Routing tie-breaker:
- If the prompt includes data lifecycle language (`streaming`, `event-time`, `watermark`, `lineage`, `schema evolution`, `backfill`, `CDC`), prefer `data-engineer`.
- If the prompt centers on non-data service architecture and SLO/failover strategy, prefer `systems-engineer`.
- If the prompt centers on general regression/test workflow, prefer `qa-engineer`.
- If the prompt centers on threat/risk/control/security gates, prefer `security-engineer`.
- If the prompt includes interview coaching language (`interview`, `mock`, `grade`, `round`), prefer `system-design-interview`.
