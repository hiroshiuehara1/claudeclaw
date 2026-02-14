# Workflow

## Sequence

Run the platform delivery flow in this order:
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

Do not reorder unless the user explicitly requests a different sequence.

## Stage 1: Delivery Context and Constraints Gate

### Entry criteria
- User asks for CI/CD, platform delivery, IaC, or deployment governance guidance.

### Exit criteria
- Service scope and release constraints are explicit.
- Delivery goals and pain points are explicit.

## Stage 2: Environment and Artifact Flow Gate

### Entry criteria
- Context and goals are defined.

### Exit criteria
- Environment topology is explicit.
- Artifact immutability and promotion flow are explicit.

## Stage 3: CI Pipeline Architecture Gate

### Entry criteria
- Environment flow is known.

### Exit criteria
- Build/test/security/policy gates are explicit.
- Pipeline ownership and failure handling are explicit.

Use `cicd-architecture.md`.

## Stage 4: CD Strategy and Deployment Policy Gate

### Entry criteria
- CI policy is defined.

### Exit criteria
- Deployment strategy is explicit.
- Progressive rollout and stop criteria are explicit.
- Promotion approvals are explicit.

Use `release-promotion.md`.

## Stage 5: Infrastructure-as-Code and Policy Governance Gate

### Entry criteria
- Deployment strategy is known.

### Exit criteria
- IaC workflow and review policy are explicit.
- Policy-as-code checks are explicit.
- Drift detection and remediation are explicit.

Use `iac-governance.md`.

## Stage 6: Secrets and Configuration Management Gate

### Entry criteria
- IaC and deployment governance are defined.

### Exit criteria
- Secret ownership and access policy are explicit.
- Rotation and emergency access controls are explicit.
- Config promotion and rollback policy are explicit.

Use `secrets-config.md`.

## Stage 7: Release Safety and Rollback Automation Gate

### Entry criteria
- Delivery and config policies are defined.

### Exit criteria
- Rollback triggers and automation paths are explicit.
- Data/config compatibility safeguards are explicit.
- Recovery validation checks are explicit.

## Stage 8: Platform Observability and Operations Gate

### Entry criteria
- Release safety controls are defined.

### Exit criteria
- Platform health metrics and alert thresholds are explicit.
- Support ownership and escalation model are explicit.
- Operational runbook expectations are explicit.

Use `platform-operations.md`.

## Stage 9: Change Governance and Ownership Cadence

### Entry criteria
- Operational model is defined.

### Exit criteria
- Change review cadence is explicit.
- Risk acceptance and exception ownership are explicit.

## Stage 10: Final DevOps Platform Bundle

### Entry criteria
- Stages 1 through 9 are complete.

### Exit criteria
- Final response includes all required sections from `templates.md` and passes `checklists.md`.

## Decision Table: Deployment Strategy

| Signal | Default choice | Alternative | Tradeoff focus |
|---|---|---|---|
| High-risk production changes | Progressive rollout (canary/blue-green) | Big-bang deploy | Safety vs simplicity |
| Low-risk fast iteration services | Frequent small deploys | Scheduled batch deploys | Agility vs coordination overhead |
| Tight compliance controls | Approval-gated promotion | Auto-promote | Governance rigor vs speed |

## Decision Table: IaC Governance

| Signal | Default choice | Alternative | Tradeoff focus |
|---|---|---|---|
| Multi-team shared platform | Policy-as-code + mandatory reviews | Best-effort review | Consistency vs friction |
| Frequent infra churn | Automated drift detection | Manual periodic audit | Early detection vs tooling overhead |
| Regulated environments | Strong change records and approvals | Lightweight logs | Auditability vs delivery speed |
