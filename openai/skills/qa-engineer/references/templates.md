# Templates

Use these templates to keep output consistent and implementation-ready.

## Template A: Clarifying Questions (Guided Mode)

```markdown
Before proposing the QA plan, I need to lock key quality constraints:
1. [Release scope and target users]
2. [Critical user/business flows]
3. [Highest perceived product/technical risks]
4. [Quality goals and release tolerance]
5. [Environment and test data constraints]
6. [Automation/CI constraints and timelines]
7. [Defect triage ownership and escalation model]

If any input is unknown, I will proceed with explicit assumptions.
```

## Template B: Assumptions (When Inputs Are Missing)

```markdown
Assumptions:
1. [Scope and critical flow assumptions]
2. [Risk and quality-goal assumptions]
3. [Coverage and automation assumptions]
4. [Environment/data assumptions]
5. [Release decision assumptions]
```

## Template C: Risk Matrix

```markdown
Risk inventory:
- [Risk] | Probability | Impact | Priority | Mitigation test focus
- [Risk] | Probability | Impact | Priority | Mitigation test focus
- [Risk] | Probability | Impact | Priority | Mitigation test focus

Top risks to gate release:
1. [Risk]
2. [Risk]
3. [Risk]
```

## Template D: Coverage Model by Layer

```markdown
Coverage strategy:
- Unit:
- API/contract:
- Integration:
- UI:
- E2E:

Critical flow mapping:
- [Flow] -> [Primary layer] + [Secondary layer]
- [Flow] -> [Primary layer] + [Secondary layer]
```

## Template E: Test Design and Traceability

```markdown
Test design methods:
- Boundary value and equivalence classes:
- State transition and workflow tests:
- Negative/error-path tests:

Traceability:
- [Requirement/Acceptance criterion] -> [Test objective] -> [Test layer]
- [Requirement/Acceptance criterion] -> [Test objective] -> [Test layer]
```

## Template F: Test Data and Environments

```markdown
Environment plan:
- Dev/ephemeral:
- Integration/staging:
- Pre-prod/canary:

Test data plan:
- Data generation or masking approach:
- Data reset/isolation strategy:
- Data versioning and reproducibility controls:
```

## Template G: Automation and CI Gates

```markdown
Automation scope:
- Automate now (high ROI/risk):
- Keep manual for now (with reason):

CI quality gates:
- Blocking checks:
- Advisory checks:
- Retry and flake handling policy:
```

## Template H: Defect Triage and Metrics

```markdown
Defect triage model:
- Severity and priority definitions:
- Triage SLA by severity:
- Ownership and escalation path:

Quality metrics:
- Pass/fail rate:
- Defect escape rate:
- Flake rate:
- Mean time to detect/fix:
```

## Template I: Release Gates and Acceptance

```markdown
Release readiness gates:
- Entry criteria:
- Exit criteria:
- Blocking thresholds:
- Residual-risk acceptance owner:

Go/No-go criteria:
1. [Criterion]
2. [Criterion]
3. [Criterion]
```

## Template J: Final QA Plan Bundle

```markdown
Final QA Plan Bundle:
1. Quality goals and scope
2. Assumptions and constraints
3. Risk inventory and prioritization
4. Coverage model by test layer
5. Test design strategy and traceability
6. Test data and environment plan
7. Automation scope and CI gate strategy
8. Defect triage workflow and quality metrics
9. Release readiness gates and go/no-go criteria
10. Validation plan and acceptance criteria
11. Residual risk statement and follow-up actions
```

## Template K: One-Shot Mode

Use this when the user asks for a complete answer immediately.

```markdown
I will provide a full QA strategy package. Inputs are partial, so I will state assumptions first.

## Assumptions
[Template B]

## Risk Matrix
[Template C]

## Coverage Model
[Template D]

## Test Design and Traceability
[Template E]

## Test Data and Environments
[Template F]

## Automation and CI Gates
[Template G]

## Defect Triage and Metrics
[Template H]

## Release Gates and Acceptance
[Template I]

## Final QA Plan Bundle
[Template J condensed]
```
