# Templates

Use these templates to keep output consistent and implementation-ready.

## Template A: Clarifying Questions (Guided Mode)

```markdown
Before proposing the platform plan, I need to lock delivery context:
1. [Service scope and release cadence]
2. [Environment topology and promotion constraints]
3. [Current CI/CD bottlenecks and failure patterns]
4. [IaC maturity and policy requirements]
5. [Secrets/config constraints and ownership]
6. [Rollback and incident expectations]
7. [Governance, compliance, and audit expectations]

If any input is unknown, I will proceed with explicit assumptions.
```

## Template B: Assumptions (When Inputs Are Missing)

```markdown
Assumptions:
1. [Delivery flow assumptions]
2. [Promotion and release assumptions]
3. [IaC and policy assumptions]
4. [Secrets/config assumptions]
5. [Operations and governance assumptions]
```

## Template C: Delivery Topology

```markdown
Delivery topology:
- Environments and promotion path:
- Artifact build and immutability policy:
- CI gate sequence:
- CD deployment sequence:
```

## Template D: IaC and Policy Governance

```markdown
IaC governance:
- Source-of-truth boundaries:
- Review and approval requirements:
- Policy-as-code checks:
- Drift detection and remediation workflow:
```

## Template E: Secrets and Config Controls

```markdown
Secrets/config model:
- Ownership and access boundaries:
- Rotation and emergency-access policy:
- Config promotion/rollback policy:
- Audit and traceability controls:
```

## Template F: Release Safety and Rollback

```markdown
Release safety:
- Deployment strategy:
- Progressive rollout stages:
- Stop/go and rollback triggers:
- Rollback automation workflow:
```

## Template G: Platform Operations and Governance

```markdown
Operations and governance:
- Platform KPIs and alerts:
- Support ownership and escalation:
- Change governance cadence:
- Exception policy and approvals:
```

## Template H: Final DevOps Platform Bundle

```markdown
Final DevOps Platform Bundle:
1. Delivery goals, scope, and constraints
2. Assumptions and context
3. Environment/artifact flow model
4. CI/CD architecture and gates
5. IaC governance and policy controls
6. Secrets/config management strategy
7. Release safety and rollback automation
8. Platform observability and support model
9. Change governance and risk acceptance
10. Residual risks and follow-up actions
```

## Template I: One-Shot Mode

Use this when the user asks for a complete answer immediately.

```markdown
I will provide a full delivery-platform plan. Inputs are partial, so I will state assumptions first.

## Assumptions
[Template B]

## Delivery Topology
[Template C]

## IaC and Config Governance
[Template D + Template E]

## Release Safety
[Template F]

## Operations and Governance
[Template G]

## Final DevOps Platform Bundle
[Template H condensed]
```
