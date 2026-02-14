# Templates

Use these templates to keep output consistent and implementation-ready.

## Template A: Clarifying Questions (Guided Mode)

```markdown
Before proposing the MLOps plan, I need to lock key lifecycle constraints:
1. [Model objective and business success metric]
2. [Data/feature lineage and ownership constraints]
3. [Training/eval cadence and threshold expectations]
4. [Registry/promotion governance requirements]
5. [Serving latency/cost/reliability constraints]
6. [Drift tolerance and retraining expectations]
7. [Reproducibility and compliance requirements]

If any input is unknown, I will proceed with explicit assumptions.
```

## Template B: Assumptions (When Inputs Are Missing)

```markdown
Assumptions:
1. [Model objective assumptions]
2. [Lineage/versioning assumptions]
3. [Training/eval assumptions]
4. [Serving/drift assumptions]
5. [Governance/ownership assumptions]
```

## Template C: Lineage and Lifecycle Design

```markdown
Lineage and lifecycle model:
- Dataset and feature lineage boundaries:
- Versioning policy:
- Ownership map:
- Quality controls at each stage:
```

## Template D: Training and Eval Pipeline

```markdown
Training/eval pipeline:
- Pipeline stages:
- Eval datasets and scenarios:
- Threshold gates:
- Failure and rerun policy:
```

## Template E: Registry and Promotion Governance

```markdown
Registry/promotion model:
- Registry metadata requirements:
- Promotion gates and approvals:
- Rejection/fallback policy:
- Audit trail expectations:
```

## Template F: Serving and Drift Operations

```markdown
Serving/drift plan:
- Serving rollout strategy:
- Latency/cost/reliability budgets:
- Drift signals and thresholds:
- Retraining trigger policy:
```

## Template G: Reproducibility and Incident Readiness

```markdown
Reproducibility and operations:
- Reproducibility controls:
- Governance/compliance controls:
- Ownership and escalation model:
- Incident response and corrective loop:
```

## Template H: Final MLOps Delivery Bundle

```markdown
Final MLOps Delivery Bundle:
1. Model goals, scope, and constraints
2. Assumptions and context
3. Data/feature lineage and versioning model
4. Training and evaluation pipeline design
5. Registry and promotion governance
6. Serving rollout and rollback policy
7. Drift monitoring and retraining strategy
8. Reproducibility and governance controls
9. Operations ownership and incident readiness
10. Residual risks and follow-up actions
```

## Template I: One-Shot Mode

Use this when the user asks for a complete answer immediately.

```markdown
I will provide a full MLOps lifecycle plan. Inputs are partial, so I will state assumptions first.

## Assumptions
[Template B]

## Lifecycle and Lineage
[Template C]

## Training/Eval and Promotion
[Template D + Template E]

## Serving and Drift
[Template F]

## Reproducibility and Operations
[Template G]

## Final MLOps Delivery Bundle
[Template H condensed]
```
