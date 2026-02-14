# Workflow

## Sequence

Run the QA planning flow in this order:
1. Context and quality goals gate
2. Scope and risk inventory gate
3. Coverage model and test layer strategy
4. Test design and traceability strategy
5. Test data and environment strategy
6. Automation scope and CI gate strategy
7. Non-functional and reliability validation
8. Defect triage and quality metrics
9. Release readiness gates and go/no-go criteria
10. Final QA Plan Bundle

Do not reorder unless the user explicitly requests a different sequence.

## Stage 1: Context and Quality Goals Gate

### Entry criteria
- User asks for QA strategy, test planning, release readiness, or quality gate design.

### Exit criteria
- Product/release scope is explicit.
- Target users and critical workflows are explicit.
- Quality goals are explicit.

## Stage 2: Scope and Risk Inventory Gate

### Entry criteria
- Context and goals are defined.

### Exit criteria
- Feature/system areas in scope are listed.
- Risk register is created with probability and impact.
- Highest-risk areas are prioritized.

Use `risk-model.md`.

## Stage 3: Coverage Model and Test Layer Strategy

### Entry criteria
- Risk priorities are explicit.

### Exit criteria
- Coverage distribution across layers is explicit (unit/API/integration/UI/E2E).
- Critical flow coverage is mapped.
- Regression strategy is selected.

## Stage 4: Test Design and Traceability Strategy

### Entry criteria
- Coverage model is selected.

### Exit criteria
- Test design methods are selected for key areas.
- Requirement-to-test traceability is explicit.
- Negative/error path coverage is explicit.

Use `test-design.md`.

## Stage 5: Test Data and Environment Strategy

### Entry criteria
- Test design scope is known.

### Exit criteria
- Environment tiers are defined.
- Test data generation/masking strategy is defined.
- Data reset and isolation strategy is defined.

Use `test-data-environments.md`.

## Stage 6: Automation Scope and CI Gate Strategy

### Entry criteria
- Test data/environment strategy is defined.

### Exit criteria
- Automation priorities are explicit.
- CI gate policy is explicit (blocking vs advisory checks).
- Flake management policy is explicit.

## Stage 7: Non-Functional and Reliability Validation

### Entry criteria
- Functional verification strategy exists.

### Exit criteria
- Performance, reliability, and security validation scope is explicit.
- Test environments and thresholds for non-functional checks are explicit.
- Failure injection or resilience checks are defined where relevant.

## Stage 8: Defect Triage and Quality Metrics

### Entry criteria
- Validation plan is defined.

### Exit criteria
- Severity/priority model is explicit.
- Triage workflow and SLA are explicit.
- Quality metrics and reporting cadence are explicit.

Use `defect-triage.md`.

## Stage 9: Release Readiness Gates and Go/No-Go Criteria

### Entry criteria
- Defect and quality metrics model is defined.

### Exit criteria
- Entry/exit gates are explicit.
- Blocking criteria are explicit.
- Residual-risk acceptance path is explicit.

Use `release-gates.md`.

## Stage 10: Final QA Plan Bundle

### Entry criteria
- Stages 1 through 9 complete.

### Exit criteria
- Final response includes all required sections from `templates.md` and passes `checklists.md`.

## Decision Table: Coverage Balance

| Signal | Default choice | Alternative | Tradeoff focus |
|---|---|---|---|
| High integration complexity | API + integration-heavy | UI/E2E-heavy | Signal quality vs execution speed |
| Highly visual/UI-sensitive product | Balanced with stronger UI tests | API-first only | UX confidence vs maintenance cost |
| Fast-changing backend contracts | Contract/API-focused | Broad E2E-first | Early failure detection vs end-to-end realism |

## Decision Table: Regression Strategy

| Signal | Default choice | Alternative | Tradeoff focus |
|---|---|---|---|
| Frequent releases | Risk-based selective regression | Full regression every release | Cycle time vs confidence breadth |
| Regulated/high-risk domains | Full critical-path regression | Selective regression | Assurance rigor vs release speed |
| Stable low-change system | Slim smoke + periodic full sweep | Full regression each deploy | Efficiency vs latent-risk detection |

## Decision Table: CI Gates

| Signal | Default choice | Alternative | Tradeoff focus |
|---|---|---|---|
| High release risk | Blocking critical tests | Advisory-only failures | Quality control vs throughput |
| High flakiness known | Quarantine + non-blocking retry lane | Hard-block all failures | Developer velocity vs false-stop risk |
| Monorepo with varied services | Service-scoped quality gates | Global monolithic gates | Targeted feedback vs uniform policy |
