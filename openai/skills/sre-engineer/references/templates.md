# Templates

Use these templates to keep output consistent and operations-ready.

## Template A: Clarifying Questions (Guided Mode)

```markdown
Before proposing the SRE operations plan, I need to lock key reliability context:
1. [Critical user journeys and impact model]
2. [Current SLI/SLO definitions and reliability pain points]
3. [Error-budget policy and decision ownership]
4. [Alert noise profile and paging expectations]
5. [Incident response maturity and escalation constraints]
6. [Runbook/automation constraints and team capacity]
7. [Release policy and reliability gate expectations]

If any input is unknown, I will proceed with explicit assumptions.
```

## Template B: Assumptions (When Inputs Are Missing)

```markdown
Assumptions:
1. [Service criticality and reliability objective assumptions]
2. [SLO and paging assumptions]
3. [Incident process assumptions]
4. [Runbook and automation assumptions]
5. [Release and governance assumptions]
```

## Template C: SLO and Error-Budget Policy

```markdown
SLO policy:
- SLI definitions:
- SLO targets:
- Error-budget window and burn thresholds:
- Decision owners and release actions:
```

## Template D: Alerting and Paging Plan

```markdown
Alerting and paging strategy:
- Paging alerts (user-impacting):
- Non-paging alerts (investigation):
- Noise controls (dedup/suppression/rate limits):
- Ownership and escalation path:
```

## Template E: Incident Command Plan

```markdown
Incident response model:
- Severity model:
- Command roles and responsibilities:
- Escalation and communication flow:
- Stabilization and recovery criteria:
```

## Template F: Runbooks and Automation

```markdown
Runbook and toil plan:
- Top incident runbooks:
- Manual steps targeted for automation:
- Automation priority order:
- Validation and rollback controls for automation:
```

## Template G: Postmortem and Improvement Loop

```markdown
Postmortem and corrective action model:
- Postmortem quality standard:
- Corrective action tracking workflow:
- Ownership and due-date policy:
- Recurrence prevention validation checks:
```

## Template H: Release Reliability Gates

```markdown
Release reliability policy:
- Reliability entry criteria:
- Reliability blocking conditions:
- Exception policy and approval ownership:
- Recovery readiness requirements:
```

## Template I: Final SRE Operations Bundle

```markdown
Final SRE Operations Bundle:
1. Service context and reliability goals
2. Assumptions and constraints
3. SLI/SLO and error-budget policy
4. Alerting and paging strategy
5. Incident command and escalation workflow
6. Capacity and resilience operations controls
7. Runbook and automation roadmap
8. Postmortem and corrective-action loop
9. Release reliability gates and exceptions
10. Reliability reporting cadence and ownership
11. Residual risks and follow-up actions
```

## Template J: One-Shot Mode

Use this when the user asks for a complete answer immediately.

```markdown
I will provide a full SRE operations plan. Inputs are partial, so I will state assumptions first.

## Assumptions
[Template B]

## SLO and Error Budget
[Template C]

## Alerting and Incident Model
[Template D + Template E]

## Runbooks and Improvement Loop
[Template F + Template G]

## Release Reliability Gates
[Template H]

## Final SRE Operations Bundle
[Template I condensed]
```
