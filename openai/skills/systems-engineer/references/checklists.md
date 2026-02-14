# Checklists

Use this file before delivering the final answer.

## Completeness Checklist

Mark each item as complete before finalizing:
- Problem statement and scope are explicit
- In-scope and out-of-scope boundaries are explicit
- Constraints (budget, timeline, staffing, dependencies) are explicit
- SLOs/SLIs are explicit and measurable
- MAU/DAU assumptions included
- Average and peak throughput estimated
- Storage growth and retention estimated
- Bandwidth estimated
- Headroom multiplier stated
- Architecture components identified
- Read and write paths explained
- Core dependencies and failure domains identified
- Core entities and data contracts listed
- Key APIs/events documented
- Reliability strategy defined (timeouts, retries, idempotency, backpressure)
- At least 3 failure modes with mitigations listed
- Security/compliance controls addressed
- Rollout and rollback strategy documented
- Migration strategy documented if schema/data changes exist
- Validation and release gates defined
- Open risks and follow-up actions listed

## Anti-Pattern Checklist

Reject or revise responses that show these issues:
- Generic architecture without workload assumptions
- SLOs missing or not measurable
- No distinction between average and peak traffic
- Cache added without freshness/invalidation policy
- Async processing without retry and dead-letter policy
- Rollout proposed without rollback triggers
- Migration proposed without safety sequence
- Security listed as a generic bullet list without data-flow grounding
- Final answer missing validation gates

## Production Readiness Gate

Deliver only when all are true:
- Correctness: requirements and assumptions are not contradictory
- Operability: metrics, alerts, ownership, and run actions are clear
- Safety: rollback path and blast-radius controls are explicit
- Scalability: clear path for 10x growth is present
- Compliance: data handling and retention/deletion requirements are addressed

## Decision Sanity Checks

Run quick checks on major choices:
- Storage:
  - Does consistency requirement justify the storage model?
  - Is partition/shard strategy clear for projected scale?
- Caching:
  - Is TTL or invalidation defined?
  - Are hot keys and stampedes addressed?
- Async:
  - Are retries bounded with dead-letter behavior?
  - Is idempotency strategy explicit?
- Rollout:
  - Are success and rollback metrics explicit?
  - Is blast radius controlled by stage/percentage/segment?
- Observability:
  - Are user-facing SLIs instrumented?
  - Are alerts actionable and ownership-defined?

## Trigger Routing QA

Use these prompts to verify boundary behavior against `system-design-interview`.

| Prompt | Expected primary skill | Key signal |
|---|---|---|
| "Run a mock system design interview for designing Dropbox." | `system-design-interview` | Explicit mock interview request |
| "Give me an interview-style answer for designing Twitter timelines." | `system-design-interview` | Interview-style framing |
| "Act as interviewer and grade my design tradeoffs." | `system-design-interview` | Interviewer and grading behavior |
| "Help me prepare for a system design round at Meta." | `system-design-interview` | Interview prep context |
| "Review this service design for production readiness and SLO risk." | `systems-engineer` | Production readiness and SLO |
| "Create an implementation-ready design spec with rollout and rollback plan." | `systems-engineer` | Design spec and rollout safety |
| "Plan a zero-downtime migration with canary release and backout criteria." | `systems-engineer` | Migration and release operations |
| "Evaluate reliability, operability, and incident blast radius for this architecture." | `systems-engineer` | Operability and blast radius |
| "I need SLI/SLO targets, error budget policy, and validation gates for launch." | `systems-engineer` | SLI/SLO and release gates |
| "Design a scalable chat app." | `system-design-interview` by default | Generic design prompt without production constraints |

Routing tie-breaker:
- If a prompt includes interview coaching language (`interview`, `mock`, `grade`, `round`), prefer `system-design-interview`.
- If a prompt includes production operations language (`SLO`, `rollout`, `rollback`, `migration`, `operability`, `production readiness`), prefer `systems-engineer`.
