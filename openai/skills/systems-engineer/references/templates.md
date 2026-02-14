# Templates

Use these templates to keep output consistent and implementation-ready.

## Template A: Clarifying Questions (Guided Mode)

```markdown
Before proposing the design, I need to lock production constraints:
1. [Primary user flows and critical operations]
2. [Traffic profile: DAU/MAU, peak behavior, read/write ratio]
3. [SLO targets: p95 latency, availability, durability]
4. [Consistency and correctness requirements]
5. [Compliance, residency, retention, deletion constraints]
6. [Timeline, team, cost, and dependency constraints]

If any input is unknown, I will proceed with explicit assumptions.
```

## Template B: Assumptions (When Inputs Are Missing)

```markdown
Assumptions:
1. [Workload and traffic assumptions]
2. [Latency/availability assumptions]
3. [Consistency assumptions]
4. [Security/compliance assumptions]
5. [Operational constraints assumptions]
```

## Template C: Capacity and Performance Block

```markdown
Capacity and performance estimates:
- MAU/DAU: [value]
- Operations per active user/day: [value]
- Average throughput: [formula -> value]
- Peak throughput: [multiplier -> value]
- Read/write split: [value]
- Storage/day: [formula -> value]
- Retention footprint: [value]
- Bandwidth (avg/peak): [formula -> value]
- Headroom target: [for example 2x]
```

## Template D: Architecture and Dependencies

```markdown
Proposed architecture:
1. [Edge: DNS/CDN/API gateway/load balancer]
2. [Stateless service tier]
3. [Primary data stores]
4. [Caching strategy]
5. [Async backbone and workers]
6. [Observability and control plane]
7. [External dependencies]

Primary read path:
- [Step-by-step]

Primary write path:
- [Step-by-step]

Failure domains:
- [Zone/region/service boundaries]
```

## Template E: Interfaces and Data Contracts

```markdown
Core entities:
- [Entity]: [key fields + ownership]
- [Entity]: [key fields + ownership]

Key APIs/events:
1. [Method/Event] [Name/Path]
   - Purpose:
   - Request/Schema:
   - Response/Schema:
   - Idempotency/versioning notes:
2. [Method/Event] [Name/Path]
3. [Method/Event] [Name/Path]
```

## Template F: Reliability and Risk Register

```markdown
Top failure modes and mitigations:
1. [Failure mode] -> [Detection] -> [Mitigation]
2. [Failure mode] -> [Detection] -> [Mitigation]
3. [Failure mode] -> [Detection] -> [Mitigation]

Error-budget impact:
- [How incidents map to SLO burn]

Open risks:
- [Risk] | Severity | Owner | Mitigation ETA
- [Risk] | Severity | Owner | Mitigation ETA
```

## Template G: Security and Compliance Checks

```markdown
Security/compliance review:
- Data classification and trust boundaries:
- Authn/authz model:
- Encryption in transit/at rest:
- Secrets and key management:
- Audit logging and traceability:
- Retention/deletion and residency obligations:
- Threats and control mapping:
```

## Template H: Rollout, Rollback, and Migration

```markdown
Rollout plan:
- Strategy: [canary | blue/green | shadow | feature flag]
- Stages: [stage-by-stage progression]
- Success metrics and thresholds:

Rollback plan:
- Trigger conditions:
- Rollback steps:
- Data consistency safeguards:

Migration plan (if applicable):
- Expand/contract or equivalent sequence:
- Compatibility window:
- Cutover criteria:
```

## Template I: Validation and Acceptance

```markdown
Validation plan:
- Tests: [unit, integration, load, chaos/failure injection as needed]
- Observability: [metrics/logs/traces/alerts]
- Non-functional checks: [latency, availability, durability, recovery]
- Release gates: [objective pass/fail criteria]

Acceptance criteria:
1. [Criterion]
2. [Criterion]
3. [Criterion]
```

## Template J: Final Design Spec Bundle

```markdown
Final Design Spec Bundle:
1. Problem statement and scope
2. Assumptions and constraints
3. SLO/SLI targets and non-functional requirements
4. Capacity estimates (avg/peak/headroom)
5. Proposed architecture and dependency map
6. Interface and data contract summary
7. Reliability analysis (failure modes and mitigations)
8. Security/compliance checks
9. Rollout, rollback, and migration strategy
10. Validation plan and acceptance criteria
11. Open risks and follow-up actions
```

## Template K: One-Shot Mode

Use this when the user asks for a complete answer immediately.

```markdown
I will provide a full production design package. Inputs are partial, so I will state assumptions first.

## Assumptions
[Template B]

## Capacity and Performance
[Template C]

## Architecture and Dependencies
[Template D]

## Interfaces and Data Contracts
[Template E]

## Reliability and Risks
[Template F]

## Security and Compliance
[Template G]

## Rollout, Rollback, and Migration
[Template H]

## Validation and Acceptance
[Template I]

## Final Design Spec Bundle
[Template J condensed]
```
