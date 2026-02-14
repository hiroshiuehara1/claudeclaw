# Checklists

Use this file before delivering a final answer.

## Completeness Checklist

Mark each item as complete before finalizing:
- Security goals, scope, and assumptions are explicit
- Asset inventory and sensitivity are explicit
- Trust boundaries and data flows are explicit
- Threat model and prioritized risks are explicit
- Controls are mapped to top threats
- IAM, secrets, and key management strategy is explicit
- Security validation and verification checks are explicit
- Detection and incident readiness model is explicit
- Compliance/control mapping is explicit when required
- Security release gates and exception workflow are explicit
- Residual risk and acceptance ownership are explicit
- Follow-up actions and owners are explicit

## Anti-Pattern Checklist

Reject or revise responses with these issues:
- Controls listed without threat-to-control mapping
- Threat model not tied to assets and trust boundaries
- Security checks listed without blocking criteria
- Secrets strategy missing rotation or ownership
- IAM recommendations without least-privilege rationale
- Incident plan lacks ownership or escalation path
- Compliance references are generic and non-actionable
- Residual risk is not explicitly accepted by an owner

## Operational Security Gate

Deliver only when all are true:
- Risk-driven: highest-impact threats have explicit mitigations
- Verifiable: controls have measurable validation checks
- Observable: logging and alerting cover critical abuse paths
- Governed: ownership and exception approval are explicit
- Release-safe: go/no-go security gates are objective

## Decision Sanity Checks

Run quick checks on major choices:
- Threat model:
  - Are abuse paths concrete and prioritized?
  - Are top risks linked to specific controls?
- IAM/secrets:
  - Is least privilege actually enforceable?
  - Are rotation and emergency access procedures defined?
- Validation:
  - Are blocking and advisory checks clearly separated?
  - Are false positives handled without hiding critical risk?
- Incident readiness:
  - Are detections actionable and owned?
  - Are containment and recovery steps realistic?
- Release gates:
  - Are exception approvals explicit and auditable?
  - Is residual-risk acceptance owner named?

## Trigger Routing QA

Use these prompts to verify boundary behavior across skills.

| Prompt | Expected primary skill | Key signal |
|---|---|---|
| "Threat model this auth service and propose controls." | `security-engineer` | Threat modeling and controls |
| "Define security release gates for privileged access changes." | `security-engineer` | Security go/no-go gates |
| "Plan secret rotation and key management controls." | `security-engineer` | Identity/secrets security design |
| "Set up detection and incident escalation for suspicious login activity." | `security-engineer` | Security monitoring and incident readiness |
| "Run a mock system design interview question." | `system-design-interview` | Interview framing |
| "Design service capacity, SLO, and failover architecture." | `systems-engineer` | Non-security architecture focus |
| "Plan CDC ingestion and schema evolution for analytics tables." | `data-engineer` | Data lifecycle architecture focus |
| "Build regression strategy and QA release criteria." | `qa-engineer` | General QA strategy focus |

Routing tie-breaker:
- If the prompt centers on threat/risk/control/security gates, prefer `security-engineer`.
- If the prompt centers on non-security architecture/SLO/failover decisions, prefer `systems-engineer`.
- If the prompt centers on data pipelines/models/contracts/backfills, prefer `data-engineer`.
- If the prompt centers on general test strategy and release QA workflow, prefer `qa-engineer`.
- If the prompt asks for interview coaching (`interview`, `mock`, `grade`), prefer `system-design-interview`.
