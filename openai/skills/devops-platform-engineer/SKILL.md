---
name: devops-platform-engineer
description: Production DevOps and platform engineering workflow for CI/CD architecture, infrastructure-as-code governance, environment promotion strategy, secrets and configuration management, release safety controls, and implementation-ready delivery platform plans.
---

# DevOps Platform Engineer

Use this skill for delivery platform design and release automation operations.
Focus on practical CI/CD and platform controls that improve delivery reliability and speed.

## Workflow Contract

Follow this sequence unless the user explicitly asks for one-shot output:
1. Delivery context and constraints gate
2. Environment and artifact flow gate
3. CI pipeline architecture gate
4. CD strategy and deployment policy gate
5. Infrastructure-as-code and policy governance gate
6. Secrets and configuration management gate
7. Release safety and rollback automation gate
8. Platform observability and operations gate
9. Change governance and ownership cadence
10. Final DevOps Platform Bundle

Use `references/workflow.md` for stage details and decision tables.

## Clarification Rules

In guided mode, ask 4 to 8 high-value questions before proposing the final plan. Cover:
- Team topology and service release cadence
- Environment model and promotion constraints
- Current CI/CD bottlenecks and failure patterns
- Compliance/security constraints for infra and delivery
- Rollback and incident response expectations
- IaC maturity and policy enforcement needs
- Ownership and platform support boundaries

If the user declines clarification, state explicit assumptions and continue.

## Default Assumptions

When inputs are partial, assume:
- Trunk-based delivery with staged promotion gates
- Immutable artifacts promoted across environments
- IaC as source of truth with policy checks in CI
- Centralized secrets/config policy with rotation controls
- Progressive deployment with measurable rollback triggers

State assumptions clearly and invite corrections.

## Output Modes

Use guided mode by default:
- Ask clarifying questions
- Confirm assumptions and constraints
- Proceed through workflow gates in order

Support one-shot mode when requested:
- Keep all mandatory sections
- Put unknown inputs into explicit assumptions
- Keep CI/CD, IaC, and rollback details concrete

Use `references/templates.md` for response skeletons.

## Boundary From Other Skills

This skill is not interview coaching. For interview prep or mock interview framing, prefer `system-design-interview`.
This skill is not broad architecture design ownership. For system architecture and reliability design decisions, prefer `systems-engineer`.
This skill is not data lifecycle design ownership. For pipeline/model contracts and data backfills, prefer `data-engineer`.
This skill is not general QA strategy ownership. For regression strategy and defect workflows, prefer `qa-engineer`.
This skill is not security-control ownership. For threat modeling and security control strategy, prefer `security-engineer`.
This skill is not SLO/on-call operations ownership. For incident command and reliability operations loops, prefer `sre-engineer`.
This skill is not AI runtime delivery ownership. For LLM runtime quality and guardrails, prefer `ai-engineer`.

## Quality Bar

Do not present a final answer unless all are present:
- Delivery context, constraints, and service boundaries are explicit
- Environment and artifact promotion flow is explicit
- CI architecture and gate strategy are explicit
- CD deployment strategy and release controls are explicit
- IaC governance and policy enforcement are explicit
- Secrets/config management and rotation controls are explicit
- Rollback and recovery automation is explicit
- Platform observability and operational ownership are explicit
- Change governance and escalation paths are explicit
- Residual risks and follow-up actions are explicit

Use:
- `references/checklists.md` for quality gates
- `references/cicd-architecture.md` for CI/CD topology patterns
- `references/release-promotion.md` for environment promotion and deployment safety
- `references/iac-governance.md` for infra policy and drift management
- `references/secrets-config.md` for secret/config controls
- `references/platform-operations.md` for observability and platform support model
