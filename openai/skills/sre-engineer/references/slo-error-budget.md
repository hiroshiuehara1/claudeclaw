# SLO and Error Budget

Use this guide to operationalize reliability objectives.

## SLI/SLO Baseline

Define:
- User-impacting SLIs
- Measurement windows
- SLO targets with clear units

Avoid relying only on infrastructure internals as primary SLI.

## Error Budget Policy

Define explicitly:
- Budget window length
- Burn-rate thresholds
- Actions for each threshold (release hold, mitigation, exception)
- Decision owners and escalation path

## Burn-Rate Response Model

For each burn level, define:
- Detection signal
- Required response window
- Required mitigation action
- Communication expectations

## Policy Quality Checks

A strong policy is:
- Measurable
- Actionable
- Owned
- Integrated with release decisions
