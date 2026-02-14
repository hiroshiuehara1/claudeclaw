---
name: qa-engineer
description: Production QA engineering workflow for test strategy and quality gates, risk-based test planning, test coverage and automation scope, defect triage and release readiness, and implementation-ready QA plans.
---

# QA Engineer

Use this skill for production verification strategy and release confidence planning.
Focus on practical QA decisions that reduce defect risk before launch.

## Workflow Contract

Follow this sequence unless the user explicitly asks for one-shot output:
1. Context and quality goals gate
2. Scope and risk inventory gate
3. Coverage model and test layer strategy
4. Test design and traceability strategy
5. Test data and environment strategy
6. Automation scope and CI gate strategy
7. Non-functional and reliability validation
8. Defect triage and quality metrics
9. Release readiness gates and go/no-go criteria
10. Final QA Plan Bundle

Use `references/workflow.md` for stage details and decision tables.

## Clarification Rules

In guided mode, ask 4 to 8 high-value questions before proposing the final QA plan. Cover:
- Product goals and release scope
- User-critical and revenue-critical flows
- Change surface and regression risk areas
- Quality targets and release tolerance
- Environment and test data constraints
- Automation and CI/CD constraints
- Defect handling and ownership model

If the user declines clarification, state explicit assumptions and continue.

## Default Assumptions

When inputs are partial, assume:
- Layered test pyramid with strong API/integration coverage and selective UI/E2E
- Risk-based prioritization for regression and automation
- CI quality gates for critical checks before release
- Deterministic test data setup and isolated environments
- Severity-based defect triage with explicit release blocking criteria

State assumptions clearly and invite corrections.

## Output Modes

Use guided mode by default:
- Ask clarifying questions
- Confirm assumptions and constraints
- Proceed through workflow gates in order

Support one-shot mode when requested:
- Keep all mandatory sections
- Put unknown inputs into explicit assumptions
- Keep risk, coverage, and release gate details concrete

Use `references/templates.md` for response skeletons.

## Boundary From Other Skills

This skill is not interview coaching. For interview prep or mock interview framing, prefer `system-design-interview`.
This skill is not broad service architecture planning. For platform/service architecture and SLO architecture decisions, prefer `systems-engineer`.
This skill is not data-pipeline architecture planning. For warehouse/dbt/CDC data lifecycle design, prefer `data-engineer`.

## Quality Bar

Do not present a final answer unless all are present:
- Quality goals and scope are explicit
- Risk inventory and prioritization are explicit
- Coverage by test layer is explicit
- Test design and requirement traceability are explicit
- Test data and environment plan is explicit
- Automation scope and CI gate strategy are explicit
- Non-functional validation scope is explicit
- Defect triage workflow and metrics are explicit
- Release gates and go/no-go criteria are explicit
- Residual risk and follow-up actions are explicit

Use:
- `references/checklists.md` for quality gates
- `references/risk-model.md` for risk scoring
- `references/test-design.md` for test design methods
- `references/test-data-environments.md` for environment/data strategy
- `references/defect-triage.md` for bug lifecycle handling
- `references/release-gates.md` for launch readiness gates
