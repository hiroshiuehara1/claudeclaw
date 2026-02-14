# Checklists

Use this file before delivering a final answer.

## Completeness Checklist

Mark each item as complete before finalizing:
- Delivery goals and constraints are explicit
- Environment and artifact flow are explicit
- CI gate architecture is explicit
- CD strategy and promotion policy are explicit
- IaC governance and policy checks are explicit
- Secrets/config controls and rotation policy are explicit
- Rollback automation and safety triggers are explicit
- Platform observability and support ownership are explicit
- Change governance and exception ownership are explicit
- Residual risks and follow-up actions are explicit

## Anti-Pattern Checklist

Reject or revise responses with these issues:
- Mutable artifacts promoted across environments
- CI checks defined without failure ownership
- Deployment strategy lacks rollback criteria
- IaC used without policy or drift controls
- Secrets policy lacks rotation and break-glass controls
- Platform support model lacks clear ownership
- Change governance described without auditable decisions
- Final answer missing residual-risk ownership

## Platform Delivery Gate

Deliver only when all are true:
- Build/deploy flow is reproducible
- Rollback path is objective and tested
- Policy controls are enforceable
- Ownership and escalation are explicit
- Risk acceptance path is auditable

## Decision Sanity Checks

Run quick checks on major choices:
- CI/CD:
  - Are gates aligned with release risk?
  - Are failures actionable and owned?
- IaC:
  - Are review and policy checks mandatory where needed?
  - Is drift detection operationalized?
- Secrets/config:
  - Is access least-privilege and auditable?
  - Are rotation and emergency controls defined?
- Release safety:
  - Are rollback triggers measurable?
  - Is compatibility risk addressed?

## Trigger Routing QA

Use these prompts to verify boundary behavior across skills.

| Prompt | Expected primary skill | Key signal |
|---|---|---|
| "Design CI/CD topology with policy checks and promotion gates." | `devops-platform-engineer` | Delivery platform architecture |
| "Define IaC governance and drift remediation process." | `devops-platform-engineer` | IaC operations ownership |
| "Plan secrets/config promotion and rollback controls." | `devops-platform-engineer` | Platform config governance |
| "Create deployment rollback automation with release safety triggers." | `devops-platform-engineer` | Release operations ownership |
| "Design service architecture and failover strategy." | `systems-engineer` | System architecture ownership |
| "Define on-call paging and incident command workflow." | `sre-engineer` | SRE operations ownership |
| "Plan data contract evolution and streaming backfill." | `data-engineer` | Data lifecycle ownership |
| "Build regression and test strategy for product release." | `qa-engineer` | QA strategy ownership |
| "Threat model platform perimeter and control strategy." | `security-engineer` | Security control ownership |
| "Design RAG/runtime eval gates for assistant." | `ai-engineer` | AI runtime ownership |

Routing tie-breaker:
- If the prompt centers on CI/CD/IaC/environment promotion/secrets-config delivery mechanics, prefer `devops-platform-engineer`.
- If the prompt centers on SLO/on-call/incident execution, prefer `sre-engineer`.
