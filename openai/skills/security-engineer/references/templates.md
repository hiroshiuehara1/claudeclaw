# Templates

Use these templates to keep output consistent and implementation-ready.

## Template A: Clarifying Questions (Guided Mode)

```markdown
Before proposing the security plan, I need to lock key context:
1. [Critical assets and sensitive operations]
2. [Primary trust boundaries and external exposure]
3. [Top threat concerns and attacker assumptions]
4. [Security constraints: compliance, latency, cost, delivery timeline]
5. [Identity, secrets, and key management expectations]
6. [Current controls and known gaps]
7. [Release security gate expectations and exception policy]

If any input is unknown, I will proceed with explicit assumptions.
```

## Template B: Assumptions (When Inputs Are Missing)

```markdown
Assumptions:
1. [Asset and boundary assumptions]
2. [Threat and risk appetite assumptions]
3. [Control and implementation assumptions]
4. [Validation and release-gate assumptions]
5. [Operational/compliance assumptions]
```

## Template C: Asset and Trust Boundary Summary

```markdown
Asset and boundary summary:
- Critical assets:
- Trust boundaries:
- Sensitive data flows:
- External dependencies and entry points:
```

## Template D: Threat Model and Risk Prioritization

```markdown
Threat model:
- [Threat scenario] -> [Affected asset] -> [Likelihood] -> [Impact] -> [Priority]
- [Threat scenario] -> [Affected asset] -> [Likelihood] -> [Impact] -> [Priority]

Top prioritized risks:
1. [Risk]
2. [Risk]
3. [Risk]
```

## Template E: Control Strategy and Implementation

```markdown
Control strategy:
- Preventive controls:
- Detective controls:
- Corrective controls:

Threat-to-control mapping:
- [Top threat] -> [Control set] -> [Residual risk note]
- [Top threat] -> [Control set] -> [Residual risk note]

Implementation sequence:
1. [Step]
2. [Step]
3. [Step]
```

## Template F: IAM, Secrets, and Key Management

```markdown
Identity and access:
- Authn model:
- Authz/least-privilege model:
- Privileged access controls:

Secrets and keys:
- Secret storage and access policy:
- Rotation cadence and ownership:
- Break-glass policy:
```

## Template G: Security Validation Plan

```markdown
Validation checks:
- Build-time checks:
- Runtime checks:
- Abuse/misuse-case tests:
- Gate classification (blocking vs advisory):

Failure handling:
- Triage path:
- Escalation path:
- Release decision impact:
```

## Template H: Detection and Incident Readiness

```markdown
Detection and readiness:
- Critical security telemetry:
- Alert rules and thresholds:
- Incident severity model:
- Ownership and escalation:
- Containment and recovery playbook references:
```

## Template I: Compliance Mapping (When Required)

```markdown
Compliance/control mapping:
- Applicable framework or requirements:
- Control mapping summary:
- Evidence expectations and ownership:
- Known compliance gaps and remediation plan:
```

## Template J: Security Release Gates and Exceptions

```markdown
Security release gates:
- Entry criteria:
- Blocking criteria:
- Advisory criteria:

Exception workflow:
- Exception eligibility:
- Approver roles:
- Expiration and follow-up requirements:
```

## Template K: Final Security Plan Bundle

```markdown
Final Security Plan Bundle:
1. Security goals, scope, and assumptions
2. Asset inventory and trust boundaries
3. Threat model and prioritized risks
4. Control strategy and implementation decisions
5. IAM, secrets, and key management plan
6. Security validation and verification plan
7. Detection, logging, and incident readiness plan
8. Compliance/control mapping (if required)
9. Security release gates and exception workflow
10. Residual risk statement, acceptance owner, and follow-up actions
```

## Template L: One-Shot Mode

Use this when the user asks for a complete answer immediately.

```markdown
I will provide a full security planning package. Inputs are partial, so I will state assumptions first.

## Assumptions
[Template B]

## Asset and Boundary Summary
[Template C]

## Threat Model and Risks
[Template D]

## Control Strategy
[Template E]

## IAM, Secrets, and Keys
[Template F]

## Security Validation
[Template G]

## Detection and Incident Readiness
[Template H]

## Compliance Mapping (if needed)
[Template I]

## Security Release Gates and Exceptions
[Template J]

## Final Security Plan Bundle
[Template K condensed]
```
