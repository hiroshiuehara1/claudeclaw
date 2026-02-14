# Checklists

Use this file before delivering a final answer.

## Completeness Checklist

Mark each item as complete before finalizing:
- Problem statement and data product goals are explicit
- Consumers and critical metric definitions are explicit
- Source inventory and ownership are explicit
- Freshness/SLA targets are explicit
- Volume, runtime, and storage growth estimates are explicit
- Cost drivers and headroom assumptions are explicit
- Ingestion approach and orchestration dependencies are explicit
- Model layering and ownership are explicit
- Data contracts and schema evolution policy are explicit
- Data quality and reconciliation strategy are explicit
- Lineage and observability strategy are explicit
- Backfill, cutover, and rollback strategy are explicit
- Validation gates and launch criteria are explicit
- Open risks and follow-up actions are explicit

## Anti-Pattern Checklist

Reject or revise responses with these issues:
- Pipeline design without source ownership clarity
- Freshness target missing or not measurable
- Incremental logic without late-arriving data handling
- Data quality only listed as generic checks without thresholds
- Schema migration plan missing compatibility window
- Backfill planned without idempotency or replay policy
- Cutover proposed without rollback triggers
- No lineage or ownership for critical assets
- Final answer missing validation gates

## Operational Readiness Gate

Deliver only when all are true:
- Correctness: contract, schema, and metric logic are internally consistent
- Reliability: retries, backfills, and failure recovery are defined
- Operability: telemetry, alerts, ownership, and run actions are clear
- Scalability: path to 10x volume is present
- Safety: cutover and rollback controls are explicit

## Decision Sanity Checks

Run quick checks on major choices:
- Ingestion:
  - Does ingest mode match freshness and volume needs?
  - Is source mutation behavior (upsert/delete) handled explicitly?
- Transforms:
  - Is incremental logic idempotent?
  - Are late/late-corrected records handled?
- Data quality:
  - Are checks mapped to business-critical fields and metrics?
  - Are failure severities and escalation owners defined?
- Schema evolution:
  - Is compatibility policy explicit?
  - Are consumer migration and deprecation windows defined?
- Rollout:
  - Are cutover checkpoints measurable?
  - Are rollback triggers objective?

## Trigger Routing QA

Use these prompts to verify boundary behavior across skills.

| Prompt | Expected primary skill | Key signal |
|---|---|---|
| "Design a dbt model strategy with incremental loads and quality tests." | `data-engineer` | dbt transforms and quality |
| "Plan CDC ingestion with backfill and cutover for warehouse tables." | `data-engineer` | CDC, backfill, and data migration |
| "Define data contracts and schema evolution for downstream consumers." | `data-engineer` | Contract and compatibility policy |
| "Create Airflow DAG reliability rules for late-arriving data." | `data-engineer` | Workflow orchestration for data pipeline |
| "Run a mock system design interview for URL shortener." | `system-design-interview` | Interview framing |
| "Grade my system design answer and tradeoffs." | `system-design-interview` | Interview grading |
| "Review service architecture SLO and multi-region failover strategy." | `systems-engineer` | Broad service reliability architecture |
| "Plan rollout and rollback for a microservice control plane." | `systems-engineer` | Non-data service rollout focus |

Routing tie-breaker:
- If the prompt includes interview coaching language (`interview`, `mock`, `grade`, `round`), prefer `system-design-interview`.
- If the prompt includes data lifecycle language (`dbt`, `warehouse`, `schema evolution`, `data quality`, `lineage`, `backfill`, `CDC`), prefer `data-engineer`.
- If the prompt centers on non-data service architecture and SLO/reliability strategy, prefer `systems-engineer`.
