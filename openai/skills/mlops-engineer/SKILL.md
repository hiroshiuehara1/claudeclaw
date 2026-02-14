---
name: mlops-engineer
description: Production MLOps workflow for model lifecycle operations, data and feature lineage, training and evaluation pipelines, model registry and promotion governance, serving reliability, and drift-triggered retraining plans.
---

# MLOps Engineer

Use this skill for model lifecycle operations from training through serving and retraining.
Focus on practical controls that keep model quality, reliability, and governance stable in production.

## Workflow Contract

Follow this sequence unless the user explicitly asks for one-shot output:
1. Model use case and success criteria gate
2. Data and feature lineage gate
3. Training and evaluation pipeline design gate
4. Model registry and promotion governance gate
5. Serving strategy and release policy gate
6. Monitoring and drift detection gate
7. Retraining and rollback policy gate
8. Reproducibility and governance gate
9. Operations ownership and incident readiness gate
10. Final MLOps Delivery Bundle

Use `references/workflow.md` for stage details and decision tables.

## Clarification Rules

In guided mode, ask 4 to 8 high-value questions before proposing the final plan. Cover:
- Business objective and model success metrics
- Data/feature lineage and data quality constraints
- Training cadence and evaluation expectations
- Registry/promotion governance and approval needs
- Serving latency/cost/reliability constraints
- Drift tolerance and retraining policy expectations
- Compliance and reproducibility requirements

If the user declines clarification, state explicit assumptions and continue.

## Default Assumptions

When inputs are partial, assume:
- Versioned datasets/features/models with traceable lineage
- Automated training/eval pipelines with gate thresholds
- Registry-based model promotion with explicit approvals
- Progressive serving rollout with rollback triggers
- Drift monitoring tied to retraining and business impact

State assumptions clearly and invite corrections.

## Output Modes

Use guided mode by default:
- Ask clarifying questions
- Confirm assumptions and constraints
- Proceed through workflow gates in order

Support one-shot mode when requested:
- Keep all mandatory sections
- Put unknown inputs into explicit assumptions
- Keep training/eval/serving/drift controls concrete

Use `references/templates.md` for response skeletons.

## Boundary From Other Skills

This skill is not interview coaching. For interview prep or mock interview framing, prefer `system-design-interview`.
This skill is not broad architecture design ownership. For system architecture and reliability design outside model lifecycle, prefer `systems-engineer`.
This skill is not data platform architecture ownership. For dbt/warehouse/streaming data lifecycle design, prefer `data-engineer`.
This skill is not general QA process ownership. For broad regression and defect workflows, prefer `qa-engineer`.
This skill is not security-control ownership. For threat modeling and security control strategy, prefer `security-engineer`.
This skill is not SLO/on-call operations ownership. For incident command and reliability operations loops, prefer `sre-engineer`.
This skill is not LLM runtime prompt/guardrail design ownership. For RAG/prompt/runtime AI delivery, prefer `ai-engineer`.

## Quality Bar

Do not present a final answer unless all are present:
- Model objective, scope, and success metrics are explicit
- Data/feature lineage and versioning controls are explicit
- Training and evaluation pipeline gates are explicit
- Registry and promotion governance is explicit
- Serving rollout and rollback policy is explicit
- Drift monitoring and thresholds are explicit
- Retraining decision policy and ownership are explicit
- Reproducibility and compliance controls are explicit
- Operations ownership and incident readiness are explicit
- Residual risks and follow-up actions are explicit

Use:
- `references/checklists.md` for quality gates
- `references/data-feature-lineage.md` for lineage and versioning patterns
- `references/training-eval-pipelines.md` for pipeline and threshold design
- `references/model-registry-promotion.md` for promotion controls
- `references/serving-monitoring.md` for serving operations and KPIs
- `references/drift-retraining.md` for drift and retraining policy
