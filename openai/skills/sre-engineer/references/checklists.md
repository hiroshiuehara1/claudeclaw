# Checklists

Use this file before delivering a final answer.

## Completeness Checklist

Mark each item as complete before finalizing:
- Service scope and critical reliability journeys are explicit
- SLI/SLO definitions and data sources are explicit
- Error-budget policy and decision ownership are explicit
- Alerting and paging strategy is explicit
- Incident severity and escalation workflow are explicit
- Capacity and resilience operational controls are explicit
- Runbook quality and automation priorities are explicit
- Postmortem and corrective-action tracking model is explicit
- Release reliability gates are explicit
- Reliability reporting cadence and ownership are explicit
- Residual risks and follow-up actions are explicit

## Anti-Pattern Checklist

Reject or revise responses with these issues:
- SLO targets defined without measurable SLIs
- Paging policy not linked to user-impacting signals
- Alert noise issues acknowledged without suppression strategy
- Incident process lacking role ownership
- Runbooks listed without validation or accessibility expectations
- Postmortems proposed without corrective-action tracking
- Error-budget policy missing release decision path
- Final answer missing residual-risk ownership

## SRE Readiness Gate

Deliver only when all are true:
- Reliability policy is measurable and owned
- Incident response path is actionable and role-defined
- Alerting strategy balances responsiveness and noise control
- Toil reduction plan is prioritized and feasible
- Release decisions incorporate reliability gates

## Decision Sanity Checks

Run quick checks on major choices:
- SLO policy:
  - Are SLOs tied to user experience, not only infra internals?
  - Are error-budget actions objective and owned?
- Alerting/paging:
  - Are pages reserved for urgent user-impacting conditions?
  - Are duplicate/noisy alerts controlled?
- Incident handling:
  - Are command roles and escalation explicit?
  - Are communication expectations defined?
- Runbooks/automation:
  - Are top incidents covered by tested runbooks?
  - Is automation prioritized by toil and risk?
- Postmortems:
  - Are corrective actions tracked to closure?
  - Are recurrence-prevention checks defined?

## Trigger Routing QA

Use these prompts to verify boundary behavior across skills.

| Prompt | Expected primary skill | Key signal |
|---|---|---|
| "Design SLO burn policy and release freeze rules for on-call." | `sre-engineer` | Error-budget operations ownership |
| "Create paging policy to reduce noisy alerts while protecting user impact." | `sre-engineer` | Alerting and paging operations |
| "Define incident command roles and escalation workflow for Sev1 outages." | `sre-engineer` | Incident response operations |
| "Build runbook automation roadmap for recurring incidents." | `sre-engineer` | Toil reduction and runbook execution |
| "Design new service architecture and dependency topology." | `systems-engineer` | Architecture design ownership |
| "Plan dbt streaming pipeline and backfill strategy." | `data-engineer` | Data lifecycle design ownership |
| "Build regression and defect triage workflow for release quality." | `qa-engineer` | General QA process ownership |
| "Threat model service perimeter and control strategy." | `security-engineer` | Security control ownership |
| "Run a mock system design interview for social feed." | `system-design-interview` | Interview framing |
| "Design RAG routing and eval gates for assistant." | `ai-engineer` | AI runtime delivery ownership |

Routing tie-breaker:
- If the prompt centers on SLO operations, on-call, paging, incident command, or postmortem loops, prefer `sre-engineer`.
- If the prompt centers on architecture design choices, prefer `systems-engineer`.
- If the prompt centers on interview coaching, prefer `system-design-interview`.
