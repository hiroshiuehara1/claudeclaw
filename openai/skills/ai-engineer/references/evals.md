# Evals

Use this guide to define release-quality evaluation for AI features.

## Eval Layers

Define both:
- Offline evals for deterministic regression checks
- Online evals for production behavior and drift detection

## Offline Eval Set Design

Include coverage for:
- Typical user tasks
- Edge and adversarial prompts
- High-risk refusal and policy scenarios
- Retrieval grounding and citation faithfulness

## Core Metrics

Use relevant metrics such as:
- Task success rate
- Grounding/citation faithfulness
- Refusal correctness
- Tool-call correctness
- Hallucination proxy rate

## Thresholds and Gates

Before release, define:
- Must-pass metric thresholds
- Acceptable degradation windows
- Blocking vs advisory failures
- Rollback triggers for online regressions

## Regression Discipline

For any prompt/model/policy change:
- Re-run critical offline suite
- Compare to baseline with fixed criteria
- Record decision rationale and owner
