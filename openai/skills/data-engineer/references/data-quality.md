# Data Quality

Use this guide to design production-ready data quality controls for streaming and batch systems.

## Quality Dimensions

Cover these dimensions for critical datasets and streams:
- Freshness: data arrives within SLA
- Completeness: expected records/fields are present
- Validity: values conform to domain/type constraints
- Uniqueness: deduplication rules hold
- Consistency: cross-stream/table definitions align
- Event correctness: event-time, ordering, and correction semantics are respected

## Test Taxonomy

Define checks at each layer:
- Source/event checks: schema presence, contract version validity, arrival cadence
- Processing checks: deduplication, watermark correctness, late-data handling
- Serving checks: metric constraints, dimensional consistency, business invariants

Recommended critical tests:
- Freshness thresholds per source/topic
- Contract compatibility checks per version
- Not-null and uniqueness on keys
- Referential checks between facts and dimensions
- Accepted-value checks for enums/status fields
- Duplicate/out-of-order and correction-merge checks
- Windowed row-count and metric reconciliation checks

## Event-Time Quality Controls

For streaming paths, define explicitly:
- Event-time field and validity checks
- Watermark lag thresholds and allowed lateness window
- Out-of-order tolerance and correction policy
- Late-event reprocessing policy

## Severity and Escalation

Use explicit severity levels:
- Sev1: consumer-blocking correctness issue
- Sev2: partial impact or SLA breach
- Sev3: non-critical anomaly

For each alert, include:
- Owner
- Escalation path
- Auto-remediation or safe-stop behavior

## Reconciliation Patterns

Use one or more:
- Row-count comparison (source vs destination)
- Aggregate comparison (sum/count/min/max)
- Hash/checksum comparison for critical windows
- Windowed parity checks across batch and streaming outputs
- Sample-based record parity checks

Define acceptable variance and confidence thresholds.

## Failure Handling Patterns

When checks fail:
- Quarantine bad records where possible
- Halt downstream publish for severe violations
- Retry transient source failures with bounded backoff
- Trigger replay/correction workflow for late/corrected events
- Emit audit events for incident review

## Quality Incident Review

After incidents, capture:
- Root cause category (source, transform, contract, orchestration, semantics)
- Detection gap and time-to-detect
- Recovery time and rollback behavior
- Preventive control to add
