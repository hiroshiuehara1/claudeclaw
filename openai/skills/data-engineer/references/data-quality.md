# Data Quality

Use this guide to design production-ready data quality controls.

## Quality Dimensions

Cover these dimensions for critical datasets:
- Freshness: data arrives within SLA
- Completeness: expected rows/fields are present
- Validity: values conform to domain/type constraints
- Uniqueness: deduplication rules hold
- Consistency: cross-table and cross-system definitions align
- Accuracy proxy: reconciles against trusted sources

## Test Taxonomy

Define checks at each layer:
- Source/landing checks: schema presence, basic null rates, arrival cadence
- Staging checks: normalization rules, key integrity, deduplication
- Mart checks: metric constraints, dimensional consistency, business invariants

Recommended critical tests:
- Freshness thresholds per source
- Not-null and uniqueness on keys
- Referential checks between facts and dimensions
- Accepted-value checks for enums/status fields
- Row-count and metric reconciliation checks

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

Use at least one of:
- Row-count comparison (source vs destination)
- Aggregate comparison (sum/count/min/max)
- Hash/checksum comparison for critical windows
- Sample-based record parity checks

Define acceptable variance and confidence thresholds.

## Failure Handling Patterns

When checks fail:
- Quarantine bad records where possible
- Halt downstream publish for severe violations
- Retry transient source failures with bounded backoff
- Emit audit events for incident review

## Quality Incident Review

After incidents, capture:
- Root cause category (source, transform, contract, orchestration)
- Detection gap and time-to-detect
- Recovery time and rollback behavior
- Preventive control to add
