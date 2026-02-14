# Workflow

## Sequence

Run the security planning flow in this order:
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

Do not reorder unless the user explicitly requests a different sequence.

## Stage 1: Context and Asset Classification Gate

### Entry criteria
- User asks for threat modeling, security review, hardening, or security release decisions.

### Exit criteria
- Scope and critical workflows are explicit.
- Asset classes and sensitivity are explicit.
- Security goals are explicit.

## Stage 2: Trust Boundaries and Data-Flow Gate

### Entry criteria
- Context and asset scope are defined.

### Exit criteria
- Data flows are mapped.
- Trust boundaries and privilege boundaries are explicit.
- External dependencies and entry points are listed.

## Stage 3: Threat Model and Attacker-Path Analysis

### Entry criteria
- Boundaries and flows are explicit.

### Exit criteria
- Threat scenarios are enumerated.
- Likelihood and impact are scored.
- Priority risk list is explicit.

Use `threat-modeling.md`.

## Stage 4: Control Strategy and Security Architecture Decisions

### Entry criteria
- Prioritized threats are explicit.

### Exit criteria
- Controls mapped to top threats.
- Preventive, detective, and corrective controls balanced.
- Tradeoffs and implementation constraints stated.

Use `control-catalog.md`.

## Stage 5: Identity, Secrets, and Key Management Design

### Entry criteria
- Control strategy exists.

### Exit criteria
- Authentication and authorization posture is explicit.
- Secret lifecycle and key management plan is explicit.
- Rotation and break-glass policy is explicit.

## Stage 6: Security Validation and Verification Plan

### Entry criteria
- Control design is defined.

### Exit criteria
- Verification checks for each high-priority control are explicit.
- Blocking versus advisory security checks are explicit.
- Validation failure handling is explicit.

Use `security-validation.md`.

## Stage 7: Detection, Logging, and Incident Readiness

### Entry criteria
- Validation strategy is defined.

### Exit criteria
- Security telemetry and alerting coverage is explicit.
- Incident severity, ownership, and escalation are explicit.
- Containment and recovery readiness is explicit.

Use `incident-readiness.md`.

## Stage 8: Compliance/Control Mapping (When Applicable)

### Entry criteria
- User asks for compliance mapping or regulated context requires it.

### Exit criteria
- Required control mapping is explicit.
- Evidence ownership and collection expectations are explicit.

Use `compliance-mapping.md`.

## Stage 9: Security Release Gates and Exception Handling

### Entry criteria
- Threats, controls, and readiness are documented.

### Exit criteria
- Security go/no-go gates are explicit.
- Exception process and approval ownership are explicit.
- Residual-risk acceptance path is explicit.

## Stage 10: Final Security Plan Bundle

### Entry criteria
- Stages 1 through 9 complete.

### Exit criteria
- Final response includes all required sections from `templates.md` and passes `checklists.md`.

## Decision Table: Identity and Access

| Signal | Default choice | Alternative | Tradeoff focus |
|---|---|---|---|
| Human and service identities mixed | Central identity + role-based access | Per-service local identity | Governance simplicity vs local flexibility |
| Sensitive admin actions | MFA + just-in-time elevation | Static admin access | Reduced standing privilege vs operational friction |
| Multi-tenant isolation needs | Tenant-scoped roles/policies | Shared broad roles | Isolation rigor vs policy complexity |

## Decision Table: Control Depth

| Signal | Default choice | Alternative | Tradeoff focus |
|---|---|---|---|
| High impact and high likelihood threats | Multi-layer controls | Single primary control | Defense-in-depth vs complexity |
| Low-likelihood, low-impact threats | Monitor-first with compensating controls | Full preventive buildout | Effort prioritization vs residual risk |
| Legacy constraints block ideal controls | Compensating control set | Delay release until ideal state | Delivery speed vs risk posture |

## Decision Table: Security Gates

| Signal | Default choice | Alternative | Tradeoff focus |
|---|---|---|---|
| Critical auth/data-safety change | Blocking security gates | Advisory-only gates | Risk control vs release speed |
| Known scanner noise/flakes | Risk-filtered blocking + triage lane | Hard-block all findings | Signal quality vs false-stop risk |
| Early-stage prototype | Advisory gates + explicit exceptions | Full strict gates | Agility vs confidence |
