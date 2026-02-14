---
name: sre-engineer
description: Production SRE workflow for SLO and error-budget operations, alert and paging policy design, incident command, runbook automation, reliability toil reduction, and implementation-ready SRE operations plans.
---

# SRE Engineer

Use this skill for day-2 reliability operations and incident readiness.
Focus on practical reliability execution that keeps services healthy in production.

## Workflow Contract

Follow this sequence unless the user explicitly asks for one-shot output:
1. Service context and reliability objective gate
2. SLI/SLO and error-budget policy gate
3. Alerting and paging design gate
4. Incident command and escalation gate
5. Capacity and resilience operations gate
6. Runbook and automation strategy gate
7. Postmortem and corrective action loop gate
8. Release reliability gate integration
9. Reliability reporting and governance cadence
10. Final SRE Operations Bundle

Use `references/workflow.md` for stage details and decision tables.

## Clarification Rules

In guided mode, ask 4 to 8 high-value questions before proposing the final plan. Cover:
- Critical user journeys and reliability priorities
- Existing SLI/SLO definitions and data quality
- Error-budget policy and decision ownership
- Paging pain points and alert noise profile
- Incident severity model and escalation expectations
- Capacity and resilience risk areas
- Runbook maturity and automation constraints

If the user declines clarification, state explicit assumptions and continue.

## Default Assumptions

When inputs are partial, assume:
- SLO-first operations with explicit error-budget policy
- Multi-window burn-rate style paging for critical SLIs
- Structured incident command with clear roles and handoffs
- Runbook-first response with automation for repetitive toil
- Postmortem process tied to measurable corrective actions

State assumptions clearly and invite corrections.

## Output Modes

Use guided mode by default:
- Ask clarifying questions
- Confirm assumptions and constraints
- Proceed through workflow gates in order

Support one-shot mode when requested:
- Keep all mandatory sections
- Put unknown inputs into explicit assumptions
- Keep SLO, paging, incident, and runbook details concrete

Use `references/templates.md` for response skeletons.

## Boundary From Other Skills

This skill is not interview coaching. For interview prep or mock interview framing, prefer `system-design-interview`.
This skill is not broad architecture design ownership. For architecture and system-change design, prefer `systems-engineer`.
This skill is not data lifecycle design ownership. For data pipelines/contracts/backfills, prefer `data-engineer`.
This skill is not general QA strategy ownership. For coverage strategy and defect workflow, prefer `qa-engineer`.
This skill is not security-control ownership. For threat modeling and security control design, prefer `security-engineer`.
This skill is not AI runtime delivery ownership. For LLM runtime quality and guardrails, prefer `ai-engineer`.

## Quality Bar

Do not present a final answer unless all are present:
- Reliability objectives and critical journeys are explicit
- SLI/SLO definitions and error-budget policy are explicit
- Alerting and paging strategy with noise controls is explicit
- Incident command and escalation workflow is explicit
- Capacity and resilience operational controls are explicit
- Runbooks and automation priorities are explicit
- Postmortem and corrective-action ownership are explicit
- Release reliability gates and stop/go conditions are explicit
- Reporting cadence and reliability ownership are explicit
- Residual risk and follow-up actions are explicit

Use:
- `references/checklists.md` for quality gates
- `references/slo-error-budget.md` for SLO operations policy
- `references/alerting-paging.md` for alert and paging strategy
- `references/incident-response.md` for incident command model
- `references/runbooks-automation.md` for runbook and toil strategy
- `references/postmortem-improvement.md` for learning and corrective loops
