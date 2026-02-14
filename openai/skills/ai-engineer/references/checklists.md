# Checklists

Use this file before delivering a final answer.

## Completeness Checklist

Mark each item as complete before finalizing:
- Use case goals, users, and success metrics are explicit
- Failure mode inventory and unacceptable outcomes are explicit
- Retrieval/context strategy is explicit when required
- Prompt/runtime architecture and tool boundaries are explicit
- Model routing and latency/cost budget are explicit
- Guardrails and policy enforcement strategy are explicit
- Eval datasets, metrics, and thresholds are explicit
- Rollout, fallback, and experiment plan are explicit
- Monitoring signals, alerts, and incident ownership are explicit
- Residual risk statement and follow-up actions are explicit

## Anti-Pattern Checklist

Reject or revise responses with these issues:
- Shipping LLM behavior without measurable eval thresholds
- RAG recommended without corpus quality or freshness assumptions
- Guardrails listed without concrete enforcement points
- Tool-use enabled without permission boundaries
- Model routing described without budget or latency constraints
- No fallback strategy for model or retrieval failures
- No monitoring plan for answer quality and refusal anomalies
- Final answer missing residual risk ownership

## Operational AI Gate

Deliver only when all are true:
- Quality: success criteria and eval thresholds are measurable
- Safety: guardrails and policy controls are enforceable
- Reliability: fallback and rollback behavior are explicit
- Operability: monitoring, alerts, and ownership are clear
- Governance: residual-risk acceptance path is explicit

## Decision Sanity Checks

Run quick checks on major choices:
- Retrieval:
  - Is grounding strategy aligned with hallucination risk?
  - Is context freshness and indexing policy explicit?
- Runtime:
  - Are tool permissions scoped by risk?
  - Are fallback paths deterministic and safe?
- Evals:
  - Are offline and online checks both defined?
  - Are release gates based on objective thresholds?
- Routing:
  - Is model tiering linked to risk and budget?
  - Are latency/cost tradeoffs explicit?
- Monitoring:
  - Are quality proxy metrics actionable?
  - Are incident escalation owners defined?

## Trigger Routing QA

Use these prompts to verify boundary behavior across skills.

| Prompt | Expected primary skill | Key signal |
|---|---|---|
| "Design RAG strategy with citation faithfulness requirements." | `ai-engineer` | Retrieval and grounding quality |
| "Define eval thresholds for model upgrade rollout." | `ai-engineer` | AI evaluation gates |
| "Plan prompt injection defenses for tool-calling assistant." | `ai-engineer` | AI runtime safety and tool boundaries |
| "Set model routing policy for cost/latency/quality tiers." | `ai-engineer` | Model routing tradeoffs |
| "Design service failover architecture and SLO budgets." | `systems-engineer` | Broad service architecture focus |
| "Plan CDC ingestion and schema evolution for data platform." | `data-engineer` | Data lifecycle architecture focus |
| "Build release regression strategy and defect triage workflow." | `qa-engineer` | General QA process focus |
| "Threat model IAM and define security controls." | `security-engineer` | Security threat/control ownership |
| "Run a mock system design interview for messaging app." | `system-design-interview` | Interview framing |

Routing tie-breaker:
- If the prompt centers on LLM behavior quality, retrieval, guardrails, evals, or model routing, prefer `ai-engineer`.
- If the prompt centers on non-AI service architecture and SLO/failover, prefer `systems-engineer`.
- If the prompt centers on data pipelines/contracts/backfills, prefer `data-engineer`.
- If the prompt centers on broad test process and release QA mechanics, prefer `qa-engineer`.
- If the prompt centers on threat modeling and security controls, prefer `security-engineer`.
- If the prompt asks for interview coaching (`interview`, `mock`, `grade`), prefer `system-design-interview`.
