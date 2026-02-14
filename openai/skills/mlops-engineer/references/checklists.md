# Checklists

Use this file before delivering a final answer.

## Completeness Checklist

Mark each item as complete before finalizing:
- Model objective, scope, and success metrics are explicit
- Data/feature lineage and ownership are explicit
- Dataset/feature/model versioning policy is explicit
- Training and evaluation gates are explicit
- Registry and promotion governance is explicit
- Serving rollout and rollback strategy is explicit
- Monitoring and drift thresholds are explicit
- Retraining trigger policy is explicit
- Reproducibility and governance controls are explicit
- Operations ownership and incident workflow are explicit
- Residual risks and follow-up actions are explicit

## Anti-Pattern Checklist

Reject or revise responses with these issues:
- Model promotion without explicit eval thresholds
- Lineage described without ownership/version controls
- Drift discussed without actionable thresholds
- Retraining proposed without rollback validation
- Serving rollout defined without stop/go triggers
- Governance controls listed without evidence ownership
- Final answer missing residual-risk ownership

## MLOps Readiness Gate

Deliver only when all are true:
- Model quality policy is measurable
- Promotion governance is enforceable
- Serving and rollback policies are actionable
- Drift/retraining loop is owned and testable
- Reproducibility and audit controls are explicit

## Decision Sanity Checks

Run quick checks on major choices:
- Lineage/versioning:
  - Can every deployed model be traced to data/features/code?
  - Are version transitions explicit?
- Training/evals:
  - Are threshold gates objective and reproducible?
  - Are eval datasets representative of risk areas?
- Serving:
  - Are latency/cost/reliability budgets explicit?
  - Are rollback triggers measurable?
- Drift/retraining:
  - Are drift thresholds and actions explicit?
  - Is retraining tied to business impact, not only statistical shift?

## Trigger Routing QA

Use these prompts to verify boundary behavior across skills.

| Prompt | Expected primary skill | Key signal |
|---|---|---|
| "Design model registry promotion gates and approval workflow." | `mlops-engineer` | Model lifecycle governance |
| "Define drift thresholds and retraining trigger policy." | `mlops-engineer` | Drift and retraining operations |
| "Plan training/eval pipeline with reproducibility controls." | `mlops-engineer` | Training lifecycle ownership |
| "Design serving rollout and model rollback policy." | `mlops-engineer` | Model serving operations |
| "Design RAG prompt/runtime guardrails for assistant." | `ai-engineer` | LLM app runtime ownership |
| "Plan dbt streaming pipeline and backfill policy." | `data-engineer` | Data lifecycle ownership |
| "Design SLO paging and incident command model." | `sre-engineer` | SRE operations ownership |
| "Design service architecture and failover strategy." | `systems-engineer` | Architecture ownership |
| "Build regression strategy and release quality gates." | `qa-engineer` | QA process ownership |
| "Threat model service controls and compliance mapping." | `security-engineer` | Security control ownership |

Routing tie-breaker:
- If the prompt centers on model lifecycle operations (training/eval/registry/serving/drift/retraining), prefer `mlops-engineer`.
- If the prompt centers on LLM runtime behavior design (RAG/prompt/guardrails), prefer `ai-engineer`.
