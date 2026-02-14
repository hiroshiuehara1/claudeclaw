# Workflow

## Sequence

Run the MLOps lifecycle flow in this order:
1. Model use case and success criteria gate
2. Data and feature lineage gate
3. Training and evaluation pipeline design gate
4. Model registry and promotion governance gate
5. Serving strategy and release policy gate
6. Monitoring and drift detection gate
7. Retraining and rollback policy gate
8. Reproducibility and governance gate
9. Operations ownership and incident readiness gate
10. Final MLOps Delivery Bundle

Do not reorder unless the user explicitly requests a different sequence.

## Stage 1: Model Use Case and Success Criteria Gate

### Entry criteria
- User asks for model lifecycle, training/eval, serving, or drift/retraining planning.

### Exit criteria
- Use case scope and model objective are explicit.
- Success metrics and business impact are explicit.

## Stage 2: Data and Feature Lineage Gate

### Entry criteria
- Use case and goals are defined.

### Exit criteria
- Data and feature lineage are explicit.
- Dataset/feature versioning policy is explicit.
- Ownership and quality controls are explicit.

Use `data-feature-lineage.md`.

## Stage 3: Training and Evaluation Pipeline Design Gate

### Entry criteria
- Lineage and data controls are known.

### Exit criteria
- Training pipeline stages are explicit.
- Evaluation datasets and thresholds are explicit.
- Failure handling and rerun policy are explicit.

Use `training-eval-pipelines.md`.

## Stage 4: Model Registry and Promotion Governance Gate

### Entry criteria
- Training/eval pipeline is defined.

### Exit criteria
- Registry versioning and metadata policy are explicit.
- Promotion criteria and approvals are explicit.
- Rejection and fallback policy is explicit.

Use `model-registry-promotion.md`.

## Stage 5: Serving Strategy and Release Policy Gate

### Entry criteria
- Registry governance is defined.

### Exit criteria
- Serving architecture and rollout path are explicit.
- Latency/cost/reliability budgets are explicit.
- Rollback triggers are explicit.

Use `serving-monitoring.md`.

## Stage 6: Monitoring and Drift Detection Gate

### Entry criteria
- Serving policy is defined.

### Exit criteria
- Model/data drift signals and thresholds are explicit.
- Quality/performance monitoring cadence is explicit.
- Alert ownership is explicit.

Use `drift-retraining.md`.

## Stage 7: Retraining and Rollback Policy Gate

### Entry criteria
- Drift monitoring is defined.

### Exit criteria
- Retraining trigger policy is explicit.
- Retraining validation gates are explicit.
- Rollback and rollback-validation policy is explicit.

## Stage 8: Reproducibility and Governance Gate

### Entry criteria
- Retraining policy exists.

### Exit criteria
- Reproducibility controls are explicit.
- Compliance/governance requirements are explicit.
- Evidence and audit ownership are explicit.

## Stage 9: Operations Ownership and Incident Readiness Gate

### Entry criteria
- Governance controls are defined.

### Exit criteria
- Operational ownership is explicit.
- Incident triage and escalation model is explicit.
- Corrective-action loop is explicit.

## Stage 10: Final MLOps Delivery Bundle

### Entry criteria
- Stages 1 through 9 are complete.

### Exit criteria
- Final response includes all required sections from `templates.md` and passes `checklists.md`.

## Decision Table: Promotion Policy

| Signal | Default choice | Alternative | Tradeoff focus |
|---|---|---|---|
| High-risk model impact | Strict promotion gates with approvals | Auto-promote | Safety/governance vs speed |
| Low-risk model use case | Automated promotion with safeguards | Manual approvals always | Delivery speed vs oversight |
| Unstable eval performance | Hold promotion and investigate | Promote with exception | Quality confidence vs release pressure |

## Decision Table: Drift Response

| Signal | Default choice | Alternative | Tradeoff focus |
|---|---|---|---|
| Severe quality drift | Trigger retraining and rollout controls | Monitor-only | Rapid correction vs resource cost |
| Temporary data shift | Adaptive thresholds + watch window | Immediate retrain | Stability vs responsiveness |
| Chronic drift and stale features | Feature/data refresh + retrain | Repeated retrain only | Root-cause fix vs short-term patching |
