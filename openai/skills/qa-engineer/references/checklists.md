# Checklists

Use this file before delivering a final answer.

## Completeness Checklist

Mark each item as complete before finalizing:
- Quality goals and release scope are explicit
- In-scope and out-of-scope surfaces are explicit
- Risk inventory and prioritization are explicit
- Coverage model by test layer is explicit
- Test design and traceability strategy is explicit
- Negative/error path coverage is explicit
- Test data and environment plan is explicit
- Automation scope and CI gate policy are explicit
- Non-functional validation scope and thresholds are explicit
- Defect triage process and SLAs are explicit
- Release gates and go/no-go criteria are explicit
- Residual risk statement and follow-up actions are explicit

## Anti-Pattern Checklist

Reject or revise responses with these issues:
- E2E-only strategy with no API/integration foundation
- Coverage not linked to risk priorities
- No traceability between requirements and tests
- Test data strategy missing isolation/reset rules
- Automation plan without flake handling policy
- Defect severity model absent or inconsistent
- Release decision criteria vague or subjective
- No residual-risk statement before release recommendation

## Operational Readiness Gate

Deliver only when all are true:
- Correctness: high-risk behaviors are explicitly verified
- Reliability: failure handling and non-functional checks are included
- Operability: metrics, triage ownership, and escalation are explicit
- Repeatability: test environment and data setup are deterministic
- Release safety: go/no-go gates and block criteria are objective

## Decision Sanity Checks

Run quick checks on major choices:
- Coverage:
  - Are critical flows covered at the right layer?
  - Is UI/E2E usage justified by risk?
- Test design:
  - Are boundary and negative tests present for risky logic?
  - Is traceability to requirements explicit?
- Test data/environment:
  - Is data realistic enough for risk scenarios?
  - Is contamination/flakiness risk controlled?
- Automation/CI:
  - Are blocking checks aligned to release risk?
  - Is flake policy explicit and actionable?
- Release gates:
  - Are pass/fail thresholds measurable?
  - Is residual-risk acceptance ownership explicit?

## Trigger Routing QA

Use these prompts to verify boundary behavior across skills.

| Prompt | Expected primary skill | Key signal |
|---|---|---|
| "Build a risk-based QA strategy for checkout release." | `qa-engineer` | QA strategy and risk prioritization |
| "Define regression scope and blocking CI quality gates." | `qa-engineer` | Coverage and release quality gates |
| "Create defect triage policy with severity SLA." | `qa-engineer` | Defect lifecycle and triage |
| "Plan test data and environment isolation for reliable automation." | `qa-engineer` | QA data/environment strategy |
| "Run a mock system design interview question." | `system-design-interview` | Interview framing |
| "Design service failover architecture and SLO model." | `systems-engineer` | Broad service architecture focus |
| "Plan CDC ingestion, dbt contracts, and data backfill." | `data-engineer` | Data lifecycle architecture focus |

Routing tie-breaker:
- If the prompt centers on verification, coverage, defects, or release test gates, prefer `qa-engineer`.
- If the prompt centers on broad system architecture and service reliability design, prefer `systems-engineer`.
- If the prompt centers on data pipelines/models/contracts/backfills, prefer `data-engineer`.
- If the prompt asks for interview coaching (`interview`, `mock`, `grade`), prefer `system-design-interview`.
