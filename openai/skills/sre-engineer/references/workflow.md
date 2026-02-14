# Workflow

## Sequence

Run the SRE operations flow in this order:
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

Do not reorder unless the user explicitly requests a different sequence.

## Stage 1: Service Context and Reliability Objective Gate

### Entry criteria
- User asks for reliability operations, incident readiness, or SRE process design.

### Exit criteria
- Service scope and critical journeys are explicit.
- Reliability objectives and business impact are explicit.

## Stage 2: SLI/SLO and Error-Budget Policy Gate

### Entry criteria
- Context and service scope are defined.

### Exit criteria
- SLIs and SLO targets are explicit and measurable.
- Error-budget consumption policy is explicit.
- Decision ownership for budget breaches is explicit.

Use `slo-error-budget.md`.

## Stage 3: Alerting and Paging Design Gate

### Entry criteria
- SLO policy is defined.

### Exit criteria
- Paging criteria linked to user impact are explicit.
- Noise controls and dedup/suppression strategy are explicit.
- Alert ownership and escalation paths are explicit.

Use `alerting-paging.md`.

## Stage 4: Incident Command and Escalation Gate

### Entry criteria
- Paging strategy exists.

### Exit criteria
- Incident severity model is explicit.
- Incident command roles and communication flow are explicit.
- Escalation and handoff criteria are explicit.

Use `incident-response.md`.

## Stage 5: Capacity and Resilience Operations Gate

### Entry criteria
- Incident model is defined.

### Exit criteria
- Capacity risk signals and thresholds are explicit.
- Resilience drills and failure-mode operation checks are explicit.
- Backlog/recovery expectations are explicit.

## Stage 6: Runbook and Automation Strategy Gate

### Entry criteria
- Operational risks are identified.

### Exit criteria
- Runbooks for top incidents are explicit.
- Toil-heavy steps and automation priorities are explicit.
- Automation ownership and validation gates are explicit.

Use `runbooks-automation.md`.

## Stage 7: Postmortem and Corrective Action Loop Gate

### Entry criteria
- Runbook strategy is defined.

### Exit criteria
- Postmortem quality standard is explicit.
- Corrective action tracking model is explicit.
- Prevention checks for recurrence are explicit.

Use `postmortem-improvement.md`.

## Stage 8: Release Reliability Gate Integration

### Entry criteria
- Corrective-action loop is defined.

### Exit criteria
- Reliability release gates are explicit.
- Stop/go criteria tied to SLO and incidents are explicit.

## Stage 9: Reliability Reporting and Governance Cadence

### Entry criteria
- Release reliability policy is defined.

### Exit criteria
- Reliability KPI reporting cadence is explicit.
- Ownership for review and policy updates is explicit.

## Stage 10: Final SRE Operations Bundle

### Entry criteria
- Stages 1 through 9 are complete.

### Exit criteria
- Final response includes all required sections from `templates.md` and passes `checklists.md`.

## Decision Table: Paging Strategy

| Signal | Default choice | Alternative | Tradeoff focus |
|---|---|---|---|
| User-impacting SLO burn | Immediate page | Ticket-only alert | Fast response vs pager load |
| Noisy non-user-impact signals | Non-paging alert + trend review | Immediate page | Signal quality vs rapid response |
| Repetitive transient noise | Aggregation/suppression | Individual pages | Pager fatigue vs visibility |

## Decision Table: Error-Budget Policy

| Signal | Default choice | Alternative | Tradeoff focus |
|---|---|---|---|
| Budget burn exceeds threshold | Freeze risky releases | Continue with mitigations | Reliability protection vs delivery speed |
| Stable budget and healthy trend | Continue planned releases | Freeze by default | Throughput vs caution |
| Burn from known temporary issue | Controlled exception with owner | Automatic freeze | Flexibility vs governance rigor |

## Decision Table: Toil Reduction

| Signal | Default choice | Alternative | Tradeoff focus |
|---|---|---|---|
| High-frequency manual incident step | Automate with guardrails | Keep manual | Reliability speed vs implementation effort |
| Rare high-risk operation | Runbook-assisted manual | Full automation | Safety assurance vs toil |
| Unclear ownership | Establish ownership first | Implement tooling first | Accountability vs rapid tooling |
