# Model Routing

Use this guide to balance quality, latency, and cost for AI workloads.

## Routing Strategy

Segment workloads by risk and complexity:
- High-risk/high-accuracy tasks -> premium model route
- Standard tasks -> balanced model route
- Low-risk/high-volume tasks -> cost-efficient model route

## Dynamic Routing Inputs

Consider:
- Prompt complexity
- Required response quality
- Latency SLA
- Cost budget
- Tool-use and policy risk level

## Fallback Policy

Define explicit fallback chain:
- Primary model
- Secondary model
- Safe degraded response mode

Include failure thresholds and retry limits.

## Budget Controls

Control spend and performance via:
- Max token budgets by route
- Context truncation or summarization policy
- Rate limiting and queueing policy
- Cost anomaly alerts

## Routing Validation

Before rollout, validate:
- Quality parity between tiers for expected tasks
- Latency and cost impact per route
- Failure behavior under route fallback conditions
