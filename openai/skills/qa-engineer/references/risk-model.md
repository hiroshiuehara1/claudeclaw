# Risk Model

Use this guide to prioritize test effort by business and technical risk.

## Probability x Impact Model

Score each risk using two dimensions:
- Probability: likelihood of occurrence
- Impact: user/business/operational impact if it occurs

Simple scoring pattern:

```text
risk_score = probability_score * impact_score
```

Use a bounded scale (for example 1 to 5) and define thresholds for priority tiers.

## Risk Categories

Cover at least these categories where relevant:
- Functional correctness risk
- Integration/dependency risk
- Data integrity risk
- Performance/scalability risk
- Security/compliance risk
- Usability/accessibility risk
- Operational/release process risk

## Priority Tiers

Example tiering:
- Tier 1 (highest): release-blocking risk, must-have coverage and gates
- Tier 2: high-value coverage, strong signal preferred before release
- Tier 3: monitor or sample-based checks, may defer with explicit acceptance

## Traceability Requirement

For each top risk, define:
- Detection tests by layer
- Monitoring signal post-release
- Ownership for response

No top risk should remain without a validation approach.

## Residual Risk Statement

Before go/no-go recommendation, include:
- Risks not fully mitigated
- Why residual risk is accepted or not accepted
- Owner responsible for acceptance decision
