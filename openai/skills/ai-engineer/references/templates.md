# Templates

Use these templates to keep output consistent and implementation-ready.

## Template A: Clarifying Questions (Guided Mode)

```markdown
Before proposing the AI delivery plan, I need to lock key constraints:
1. [Primary user outcome and business metric]
2. [High-risk failure modes and unacceptable outputs]
3. [Knowledge source quality/freshness and grounding needs]
4. [Latency and cost constraints]
5. [Safety/policy boundaries and refusal expectations]
6. [Current model/tooling constraints]
7. [Rollout and release gating expectations]

If any input is unknown, I will proceed with explicit assumptions.
```

## Template B: Assumptions (When Inputs Are Missing)

```markdown
Assumptions:
1. [Use case and user assumptions]
2. [Risk and policy assumptions]
3. [Retrieval/runtime assumptions]
4. [Latency/cost assumptions]
5. [Release and ownership assumptions]
```

## Template C: Failure Modes and Risk Boundaries

```markdown
Failure mode inventory:
- [Failure mode] -> [Impact] -> [Mitigation strategy]
- [Failure mode] -> [Impact] -> [Mitigation strategy]
- [Failure mode] -> [Impact] -> [Mitigation strategy]

Unacceptable outcomes:
1. [Outcome]
2. [Outcome]
```

## Template D: Retrieval and Context Strategy

```markdown
Retrieval/context plan:
- Corpus and source-of-truth boundaries:
- Indexing and update cadence:
- Retrieval strategy (keyword/vector/hybrid/rerank):
- Context assembly and citation grounding:
- Retrieval failure fallback behavior:
```

## Template E: Prompt and Runtime Architecture

```markdown
Runtime architecture:
- Prompt structure and control variables:
- Tool-use policy and permissions:
- Multi-step reasoning/orchestration approach:
- Fallback behavior for tool/model failures:
```

## Template F: Model Routing, Latency, and Cost

```markdown
Model routing plan:
- Task classes and model tiers:
- Routing criteria (risk/complexity/latency):
- Fallback model chain:

Budget constraints:
- Latency budget:
- Cost budget:
- Token/context budget controls:
```

## Template G: Guardrails and Policy Enforcement

```markdown
Guardrail plan:
- Input safeguards:
- Output safeguards:
- Prompt injection defenses:
- Unsafe tool-call prevention:
- Refusal and escalation behavior:
```

## Template H: Eval Strategy and Thresholds

```markdown
Eval plan:
- Offline eval sets and coverage:
- Online quality monitoring signals:
- Safety and policy eval checks:
- Regression suite for prompt/model updates:

Release thresholds:
- Must-pass metrics:
- Allowed variance:
- Block/rollback triggers:
```

## Template I: Rollout and Monitoring

```markdown
Rollout strategy:
- Staged ramp plan:
- Experiment/control setup:
- Fallback and rollback criteria:

Monitoring and incident response:
- Quality metrics and alerts:
- Latency/cost alerts:
- Ownership and escalation path:
```

## Template J: Final AI Delivery Plan Bundle

```markdown
Final AI Delivery Plan Bundle:
1. Use case goals, users, and success metrics
2. Assumptions, constraints, and risk boundaries
3. Failure-mode inventory and mitigations
4. Retrieval/context strategy
5. Prompt/runtime architecture and tool-use policy
6. Model routing with latency/cost budget
7. Guardrails and policy enforcement plan
8. Eval strategy with thresholds and pass/fail gates
9. Rollout, experimentation, and fallback plan
10. Monitoring, incident triggers, and ownership
11. Residual risks and follow-up actions
```

## Template K: One-Shot Mode

Use this when the user asks for a complete answer immediately.

```markdown
I will provide a full AI delivery package. Inputs are partial, so I will state assumptions first.

## Assumptions
[Template B]

## Failure Modes and Risk Boundaries
[Template C]

## Retrieval and Context
[Template D]

## Runtime and Model Routing
[Template E + Template F]

## Guardrails
[Template G]

## Evals and Thresholds
[Template H]

## Rollout and Monitoring
[Template I]

## Final AI Delivery Plan Bundle
[Template J condensed]
```
