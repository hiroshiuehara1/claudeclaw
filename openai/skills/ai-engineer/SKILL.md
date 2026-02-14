---
name: ai-engineer
description: Production AI engineering workflow for LLM application delivery, RAG and retrieval design, AI evaluation and quality gates, guardrails and safe tool behavior, model routing and latency/cost tradeoff analysis, and implementation-ready AI delivery plans.
---

# AI Engineer

Use this skill for production LLM feature delivery.
Focus on practical decisions that improve AI quality, safety, and operability.

## Workflow Contract

Follow this sequence unless the user explicitly asks for one-shot output:
1. Use case, users, and success metric gate
2. Failure modes and risk boundary gate
3. Retrieval and context strategy gate
4. Prompt and runtime architecture gate
5. Model routing, latency, and cost gate
6. Guardrails and policy enforcement gate
7. Eval design and quality threshold gate
8. Rollout and experimentation gate
9. Monitoring and incident response gate
10. Final AI Delivery Plan Bundle

Use `references/workflow.md` for stage details and decision tables.

## Clarification Rules

In guided mode, ask 4 to 8 high-value questions before proposing the final plan. Cover:
- Target user outcomes and business success metrics
- Highest-impact failure modes and unacceptable outcomes
- Knowledge source quality, freshness, and retrieval constraints
- Latency and cost constraints
- Policy, safety, and refusal boundaries
- Existing model/tooling constraints
- Rollout and release gating expectations

If the user declines clarification, state explicit assumptions and continue.

## Default Assumptions

When inputs are partial, assume:
- RAG plus eval-first baseline for knowledge-intensive tasks
- Provider-neutral implementation patterns unless user asks for a specific stack
- Layered guardrails for input, tool-use, and output handling
- Model routing by risk/cost/latency tier
- Progressive rollout with measurable quality and safety gates

State assumptions clearly and invite corrections.

## Output Modes

Use guided mode by default:
- Ask clarifying questions
- Confirm assumptions and constraints
- Proceed through workflow gates in order

Support one-shot mode when requested:
- Keep all mandatory sections
- Put unknown inputs into explicit assumptions
- Keep retrieval, eval, guardrail, and rollout details concrete

Use `references/templates.md` for response skeletons.

## Boundary From Other Skills

This skill is not interview coaching. For interview prep or mock interview framing, prefer `system-design-interview`.
This skill is not broad non-AI service architecture planning. For platform/service architecture and SLO decisions outside AI runtime behavior, prefer `systems-engineer`.
This skill is not data pipeline architecture planning. For warehouse/dbt/CDC lifecycle design, prefer `data-engineer`.
This skill is not general QA process ownership. For broad regression strategy and defect workflow outside AI behavior quality, prefer `qa-engineer`.
This skill is not broad threat-model/control ownership. For general security architecture and threat-control strategy, prefer `security-engineer`.
This skill is not on-call reliability operations ownership. For SLO operations, paging strategy, incident command, and postmortem loops, prefer `sre-engineer`.
This skill is not CI/CD and IaC platform delivery ownership. For delivery pipeline mechanics, environment promotion, and platform release controls, prefer `devops-platform-engineer`.
This skill is not model lifecycle operations ownership. For training/eval pipelines, model registry promotion, serving rollout, and drift/retraining policy, prefer `mlops-engineer`.

## Quality Bar

Do not present a final answer unless all are present:
- Use case goals, users, and success metrics are explicit
- Failure modes and risk boundaries are explicit
- Retrieval/context strategy is explicit when applicable
- Prompt/runtime architecture and tool-use policy are explicit
- Model routing with latency/cost budget is explicit
- Guardrails and policy enforcement plan is explicit
- Eval strategy with pass/fail thresholds is explicit
- Rollout, fallback, and experimentation plan is explicit
- Monitoring and incident response ownership is explicit
- Residual risk and follow-up actions are explicit

Use:
- `references/checklists.md` for quality gates
- `references/rag-patterns.md` for retrieval architecture
- `references/evals.md` for evaluation and release thresholds
- `references/guardrails.md` for safety and policy controls
- `references/model-routing.md` for model tiering and budget decisions
- `references/ai-ops.md` for production monitoring and incident readiness
