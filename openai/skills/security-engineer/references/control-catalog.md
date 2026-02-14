# Control Catalog

Use this guide to choose practical controls by threat profile.

## Control Classes

- Preventive controls: reduce attack success probability
- Detective controls: increase detection speed and confidence
- Corrective controls: limit blast radius and restore safely

## Common Preventive Controls

- Least-privilege access and scoped credentials
- Network segmentation and boundary hardening
- Secure defaults and deny-by-default policy
- Input validation and output encoding
- Secret centralization and key management

## Common Detective Controls

- Structured security logging for critical actions
- Alerting on suspicious auth/data-access patterns
- Integrity or tamper signals for critical resources
- Dependency/config drift monitoring

## Common Corrective Controls

- Credential and key rotation procedures
- Session/token revocation and containment actions
- Automated rollback or feature kill-switch patterns
- Post-incident hardening actions and validation

## Control Selection Heuristics

For each prioritized threat:
- Choose at least one primary preventive control
- Add detective control for verification and response
- Add corrective control when impact is high

Document tradeoffs:
- Implementation effort
- Runtime overhead
- Operational complexity
- Security uplift versus residual risk
