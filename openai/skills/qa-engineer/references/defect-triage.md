# Defect Triage

Use this guide for consistent bug handling and release decisions.

## Severity and Priority

Define both:
- Severity: technical/user impact magnitude
- Priority: urgency for fix and scheduling

Severity example:
- Sev1: critical business/user outage, release blocking
- Sev2: high impact with workaround or partial degradation
- Sev3: medium impact, non-critical path
- Sev4: low impact or cosmetic

## Triage Workflow

Recommended flow:
1. Intake with minimum reproducibility details
2. Severity/priority assignment
3. Ownership assignment
4. SLA and status tracking
5. Verification and closure

## Reproducibility Standard

Every defect record should include:
- Environment and build/version
- Steps to reproduce
- Expected vs actual behavior
- Evidence (logs/screenshots/request IDs)

## SLA Guidance

Define target response and fix windows by severity.
Include escalation for SLA breaches.

## Escape-Defect Loop

For production escapes, capture:
- Why existing tests missed it
- Which gate failed or was absent
- Preventive test/process changes to add
