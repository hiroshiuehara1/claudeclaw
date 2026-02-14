# Security and Compliance

Use this checklist to ground security and compliance decisions in real data flows.

## Data and Trust Boundaries

Document:
- Data classes (public, internal, confidential, regulated)
- Data ingress and egress boundaries
- Service-to-service trust zones
- Third-party data sharing boundaries

## Identity and Access

Define:
- End-user authentication method
- Service authentication method (mTLS/token/workload identity)
- Authorization model (RBAC/ABAC/resource policies)
- Least privilege controls and periodic access review

## Data Protection

Require:
- Encryption in transit (TLS)
- Encryption at rest (managed keys or KMS)
- Secrets storage and rotation policy
- Sensitive-field handling (masking/tokenization where needed)

## Auditability and Governance

Specify:
- Audit logs for privileged and sensitive operations
- Traceability from user action to system change
- Retention windows for logs and audit artifacts
- Change approval and break-glass controls

## Compliance-Aware Questions

Ask when relevant:
- Are there residency constraints by region?
- Are there deletion deadlines (for example right-to-delete workflows)?
- Is data minimization applied to collection and retention?
- Are processor/subprocessor obligations documented?

## Security Review Output Requirements

Final response should include:
- Top threat scenarios and controls
- Residual risk summary
- Ownership for unresolved controls
- Verification method (tests/scans/reviews)
