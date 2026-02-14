---
name: systems-engineer
description: Production systems engineering workflow for architecture reviews, systems engineering plans, scalability and reliability tradeoff analysis, implementation-ready design specs, and SLO/SLI, rollout, operability, and risk analysis.
---

# Systems Engineer

Use this skill for production architecture and system change planning.
Focus on practical engineering decisions that are safe to ship and operate.

## Workflow Contract

Follow this sequence unless the user explicitly asks for one-shot output:
1. Context gate
2. Constraints and SLO gate
3. Capacity and performance estimates
4. Architecture and dependency mapping
5. Interfaces and data contracts
6. Reliability and failure-mode analysis
7. Security and compliance review
8. Rollout, rollback, and migration plan
9. Validation and success criteria
10. Final Design Spec Bundle

Use `references/workflow.md` for stage details and decision tables.

## Clarification Rules

In guided mode, ask 4 to 8 high-value questions before proposing final architecture. Cover:
- Primary users and business-critical workflows
- Traffic profile (DAU/MAU, burst shape, read/write ratio)
- SLO and operational targets (latency, availability, durability)
- Consistency and correctness boundaries
- Constraints (budget, team, timeline, compliance, regions)
- Integration and dependency constraints

If the user declines clarification, state explicit assumptions and continue.

## Default Assumptions

When inputs are partial, assume:
- Stateless services behind an API gateway and load balancer
- SQL primary store for transactional workflows unless access patterns require otherwise
- Cache for read-heavy paths
- Queue or stream for async processing and fan-out
- SLO-driven observability with alerting on user-facing symptoms

State assumptions clearly and invite corrections.

## Output Modes

Use guided mode by default:
- Ask clarifying questions
- Confirm constraints and assumptions
- Proceed through all workflow gates

Support one-shot mode when requested:
- Keep all mandatory sections
- Put unknown inputs into an explicit assumptions section
- Keep capacity, reliability, rollout, and validation concrete

Use `references/templates.md` for response skeletons.

## Boundary From Other Skills

This skill is not interview coaching. For interview prep or mock interview framing, prefer `system-design-interview`.
This skill is not data lifecycle design ownership. For pipeline/model contracts, streaming operations, and backfill strategy, prefer `data-engineer`.
This skill is not general QA process ownership. For coverage strategy and defect workflow, prefer `qa-engineer`.
This skill is not security control-first ownership. For threat modeling and security control strategy, prefer `security-engineer`.
This skill is not LLM runtime delivery ownership. For retrieval, guardrails, model routing, and AI eval gates, prefer `ai-engineer`.
This skill is not SLO/on-call operations ownership. For paging strategy, incident command, and postmortem loops, prefer `sre-engineer`.
This skill is not CI/CD and IaC platform delivery ownership. For promotion mechanics, pipeline governance, and platform release controls, prefer `devops-platform-engineer`.
This skill is not model lifecycle operations ownership. For training/eval pipelines, registry promotion, and drift/retraining policy, prefer `mlops-engineer`.

## Quality Bar

Do not present a final answer unless all are present:
- Problem and scope are explicit
- SLO and constraints are explicit
- Capacity estimates include average, peak, and headroom
- Architecture includes read/write paths and key dependencies
- Interfaces and data contracts are identified
- Reliability risks and mitigations are listed
- Security/compliance checks are addressed
- Rollout, rollback, and migration safety are defined
- Validation plan and acceptance criteria are clear

Use:
- `references/checklists.md` for quality gates
- `references/capacity-formulas.md` for estimation math
- `references/reliability-playbook.md` for SLO and failure analysis
- `references/security-compliance.md` for security and data controls
- `references/rollout-patterns.md` for delivery and migration strategies
