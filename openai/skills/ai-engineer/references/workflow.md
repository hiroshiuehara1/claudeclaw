# Workflow

## Sequence

Run the AI delivery flow in this order:
1. Use case, users, and success metric gate
2. Failure modes and risk boundary gate
3. Retrieval and context strategy gate
4. Prompt and runtime architecture gate
5. Model routing, latency, and cost gate
6. Guardrails and policy enforcement gate
7. Eval design and quality threshold gate
8. Rollout and experimentation gate
9. Monitoring and incident response gate
10. Final AI Delivery Plan Bundle

Do not reorder unless the user explicitly requests a different sequence.

## Stage 1: Use Case, Users, and Success Metric Gate

### Entry criteria
- User asks for AI feature design, RAG, model behavior quality, or AI rollout planning.

### Exit criteria
- Target users and job-to-be-done are explicit.
- Success metrics are explicit.
- In-scope and out-of-scope boundaries are explicit.

## Stage 2: Failure Modes and Risk Boundary Gate

### Entry criteria
- Use case and goals are defined.

### Exit criteria
- Top failure modes are explicit.
- Unacceptable outcomes are explicit.
- Risk boundary and escalation expectations are explicit.

## Stage 3: Retrieval and Context Strategy Gate

### Entry criteria
- Failure modes and risk priorities are known.

### Exit criteria
- Need for retrieval is explicit.
- Retrieval/indexing/ranking approach is explicit.
- Context assembly and grounding strategy is explicit.

Use `rag-patterns.md`.

## Stage 4: Prompt and Runtime Architecture Gate

### Entry criteria
- Retrieval strategy is defined or explicitly unnecessary.

### Exit criteria
- Prompt/runtime flow is explicit.
- Tool-use permissions and boundaries are explicit.
- Fallback behavior is explicit.

## Stage 5: Model Routing, Latency, and Cost Gate

### Entry criteria
- Runtime flow is defined.

### Exit criteria
- Model tiering and routing logic are explicit.
- Latency and cost budgets are explicit.
- Degradation strategy under budget pressure is explicit.

Use `model-routing.md`.

## Stage 6: Guardrails and Policy Enforcement Gate

### Entry criteria
- Routing and runtime paths are known.

### Exit criteria
- Input guardrails are explicit.
- Output guardrails are explicit.
- Prompt-injection and unsafe tool-use handling are explicit.

Use `guardrails.md`.

## Stage 7: Eval Design and Quality Threshold Gate

### Entry criteria
- Runtime and guardrail strategy are defined.

### Exit criteria
- Offline eval set strategy is explicit.
- Online quality signals are explicit.
- Release pass/fail thresholds are explicit.

Use `evals.md`.

## Stage 8: Rollout and Experimentation Gate

### Entry criteria
- Eval thresholds are known.

### Exit criteria
- Rollout strategy and ramp stages are explicit.
- Experiment design and control groups are explicit.
- Rollback and fallback triggers are explicit.

## Stage 9: Monitoring and Incident Response Gate

### Entry criteria
- Rollout strategy is defined.

### Exit criteria
- Monitoring metrics and alert thresholds are explicit.
- Incident ownership and escalation are explicit.
- Post-incident correction loop is explicit.

Use `ai-ops.md`.

## Stage 10: Final AI Delivery Plan Bundle

### Entry criteria
- Stages 1 through 9 are complete.

### Exit criteria
- Final response includes all required sections from `templates.md` and passes `checklists.md`.

## Decision Table: Architecture Mode

| Signal | Default choice | Alternative | Tradeoff focus |
|---|---|---|---|
| Knowledge freshness and citations required | RAG + grounding | Prompt-only | Accuracy/traceability vs simplicity |
| Stable narrow domain with low ambiguity | Prompt-only with strict templates | RAG | Speed/cost vs external knowledge coverage |
| Multi-step external actions needed | Tool-use runtime | Retrieval-only | Capability vs safety/complexity |

## Decision Table: Model Routing

| Signal | Default choice | Alternative | Tradeoff focus |
|---|---|---|---|
| High-stakes responses | High-quality model tier | Cost-first tier | Reliability vs cost |
| High-volume low-risk interactions | Cost-efficient model tier | Premium model-only | Cost control vs top-end quality |
| Latency-sensitive UX | Low-latency route + fallback | Quality-max route | Responsiveness vs depth |

## Decision Table: Guardrail Strictness

| Signal | Default choice | Alternative | Tradeoff focus |
|---|---|---|---|
| Regulated or sensitive domain | Strict blocking policy | Advisory warnings | Safety/compliance vs coverage |
| Low-risk internal use | Balanced policy with monitoring | Strict blocking | Usability vs false refusals |
| Early prototype | Advisory-first with explicit risk notice | Strict blocking | Iteration speed vs control rigor |
