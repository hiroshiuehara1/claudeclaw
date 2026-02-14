# Alerting and Paging

Use this guide to reduce noise and improve response quality.

## Alert Classification

Define at least two classes:
- Paging alerts for urgent user-impacting reliability events
- Non-paging alerts for investigation and trend monitoring

## Noise Reduction Controls

Include controls such as:
- Deduplication/grouping
- Suppression windows
- Rate limiting
- Threshold tuning by service behavior

## Paging Design

For paging alerts define:
- Trigger condition
- Owner and escalation chain
- Expected response time
- Auto-remediation if available

## Alert Quality Metrics

Track:
- Page volume and distribution
- Actionable page rate
- False-positive rate
- Time-to-acknowledge and time-to-mitigate
