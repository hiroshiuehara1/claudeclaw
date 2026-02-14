# Checklists

Use this file before delivering the final answer.

## Completeness Checklist

Mark each item as complete before finalizing:
- Problem statement and scope are explicit
- In-scope and out-of-scope boundaries are explicit
- Constraints (budget, timeline, staffing, dependencies) are explicit
- SLOs/SLIs are explicit and measurable
- MAU/DAU assumptions included
- Average and peak throughput estimated
- Storage growth and retention estimated
- Bandwidth estimated
- Headroom multiplier stated
- Architecture components identified
- Read and write paths explained
- Core dependencies and failure domains identified
- Core entities and data contracts listed
- Key APIs/events documented
- Reliability strategy defined (timeouts, retries, idempotency, backpressure)
- At least 3 failure modes with mitigations listed
- Security/compliance controls addressed
- Rollout and rollback strategy documented
- Migration strategy documented if schema/data changes exist
- Validation and release gates defined
- Open risks and follow-up actions listed

## Anti-Pattern Checklist

Reject or revise responses that show these issues:
- Generic architecture without workload assumptions
- SLOs missing or not measurable
- No distinction between average and peak traffic
- Cache added without freshness/invalidation policy
- Async processing without retry and dead-letter policy
- Rollout proposed without rollback triggers
- Migration proposed without safety sequence
- Security listed as a generic bullet list without data-flow grounding
- Final answer missing validation gates

## Production Readiness Gate

Deliver only when all are true:
- Correctness: requirements and assumptions are not contradictory
- Operability: metrics, alerts, ownership, and run actions are clear
- Safety: rollback path and blast-radius controls are explicit
- Scalability: clear path for 10x growth is present
- Compliance: data handling and retention/deletion requirements are addressed

## Decision Sanity Checks

Run quick checks on major choices:
- Storage:
  - Does consistency requirement justify the storage model?
  - Is partition/shard strategy clear for projected scale?
- Caching:
  - Is TTL or invalidation defined?
  - Are hot keys and stampedes addressed?
- Async:
  - Are retries bounded with dead-letter behavior?
  - Is idempotency strategy explicit?
- Rollout:
  - Are success and rollback metrics explicit?
  - Is blast radius controlled by stage/percentage/segment?
- Observability:
  - Are user-facing SLIs instrumented?
  - Are alerts actionable and ownership-defined?

## Trigger Routing QA

Use these prompts to verify boundary behavior across skills.

| Prompt | Expected primary skill | Key signal |
|---|---|---|
| "Review this service design for production readiness and SLO risk." | `systems-engineer` | Production architecture and reliability design |
| "Create an implementation-ready system design spec with rollout and migration plan." | `systems-engineer` | Architecture-to-delivery design scope |
| "Run a mock system design interview for designing Dropbox." | `system-design-interview` | Interview framing and coaching |
| "Plan streaming schema evolution and replay-safe backfill." | `data-engineer` | Data lifecycle ownership |
| "Build regression strategy and release quality gates for product launch." | `qa-engineer` | QA process ownership |
| "Threat model auth boundaries and define control strategy." | `security-engineer` | Security control-first ownership |
| "Design RAG guardrails and model routing policy for assistant." | `ai-engineer` | LLM runtime delivery ownership |
| "Define SLO paging policy and incident command workflow." | `sre-engineer` | SRE day-2 operations ownership |
| "Design CI/CD promotion and IaC governance model." | `devops-platform-engineer` | Platform delivery mechanics ownership |
| "Define model registry promotion gates and drift-retraining policy." | `mlops-engineer` | Model lifecycle operations ownership |

Routing tie-breaker:
- If a prompt includes interview coaching language (`interview`, `mock`, `grade`, `round`), prefer `system-design-interview`.
- If a prompt centers on data pipelines/contracts/backfills/streaming semantics, prefer `data-engineer`.
- If a prompt centers on broad test strategy and defect workflow, prefer `qa-engineer`.
- If a prompt centers on threat/risk/control security decisions, prefer `security-engineer`.
- If a prompt centers on LLM runtime quality (RAG, guardrails, model routing, eval gates), prefer `ai-engineer`.
- If a prompt centers on on-call reliability operations (paging, incident command, postmortems), prefer `sre-engineer`.
- If a prompt centers on CI/CD, IaC, promotion pipelines, and config/secrets delivery mechanics, prefer `devops-platform-engineer`.
- If a prompt centers on model training/eval/registry/serving/drift/retraining lifecycle, prefer `mlops-engineer`.
- Otherwise, for production system architecture and dependency design, prefer `systems-engineer`.
