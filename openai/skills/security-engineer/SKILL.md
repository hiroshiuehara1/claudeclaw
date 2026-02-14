---
name: security-engineer
description: Production security engineering workflow for threat modeling and control strategy, security architecture review, secure SDLC and production hardening, security validation and release security gates, and implementation-ready security plans.
---

# Security Engineer

Use this skill for production security decision-making and risk reduction.
Focus on practical threat-driven controls that are safe to ship and operate.

## Workflow Contract

Follow this sequence unless the user explicitly asks for one-shot output:
1. Context and asset classification gate
2. Trust boundaries and data-flow gate
3. Threat model and attacker-path analysis
4. Control strategy and security architecture decisions
5. Identity, secrets, and key management design
6. Security validation and verification plan
7. Detection, logging, and incident readiness
8. Compliance/control mapping (when applicable)
9. Security release gates and exception handling
10. Final Security Plan Bundle

Use `references/workflow.md` for stage details and decision tables.

## Clarification Rules

In guided mode, ask 4 to 8 high-value questions before proposing the final plan. Cover:
- Asset sensitivity and critical business workflows
- Trust boundaries and external/internal attack surfaces
- Threat tolerance and risk appetite
- Identity model and privilege boundaries
- Security constraints (compliance, latency, cost, timeline)
- Existing controls and known gaps
- Release process and security gate expectations

If the user declines clarification, state explicit assumptions and continue.

## Default Assumptions

When inputs are partial, assume:
- Security by design through Secure SDLC checkpoints
- Least-privilege access with explicit trust boundaries
- Secrets and keys managed centrally with rotation policy
- Layered controls: preventive, detective, corrective
- Security validation before release with measurable blocking criteria

State assumptions clearly and invite corrections.

## Output Modes

Use guided mode by default:
- Ask clarifying questions
- Confirm assumptions and constraints
- Proceed through workflow gates in order

Support one-shot mode when requested:
- Keep all mandatory sections
- Put unknown inputs into explicit assumptions
- Keep threat, control, and release-gate details concrete

Use `references/templates.md` for response skeletons.

## Boundary From Other Skills

This skill is not interview coaching. For interview prep or mock interview framing, prefer `system-design-interview`.
This skill is not broad service architecture planning. For non-security architecture and SLO planning, prefer `systems-engineer`.
This skill is not data lifecycle architecture planning. For warehouse/dbt/CDC pipeline design, prefer `data-engineer`.
This skill is not general QA process ownership. For regression strategy and defect workflow outside security focus, prefer `qa-engineer`.
This skill is not LLM runtime delivery ownership. For retrieval/prompt/runtime guardrails and model-routing behavior, prefer `ai-engineer`.
This skill is not on-call reliability operations ownership. For SLO operations, paging strategy, and incident command loops, prefer `sre-engineer`.
This skill is not CI/CD and IaC platform delivery ownership. For deployment promotion mechanics and platform release controls, prefer `devops-platform-engineer`.
This skill is not model lifecycle operations ownership. For training/eval pipelines, model registry promotion, and drift/retraining policy, prefer `mlops-engineer`.

## Quality Bar

Do not present a final answer unless all are present:
- Security goals, scope, and assumptions are explicit
- Asset inventory and trust boundaries are explicit
- Threat model and prioritized risks are explicit
- Control strategy and implementation decisions are explicit
- IAM, secrets, and key management plan is explicit
- Security validation and verification plan is explicit
- Detection, logging, and incident readiness plan is explicit
- Compliance/control mapping is explicit when requested
- Security release gates and exception workflow are explicit
- Residual risk and acceptance ownership are explicit

Use:
- `references/checklists.md` for quality gates
- `references/threat-modeling.md` for threat analysis
- `references/control-catalog.md` for control choices
- `references/security-validation.md` for verification planning
- `references/incident-readiness.md` for detection and response readiness
- `references/compliance-mapping.md` for control mapping when needed
