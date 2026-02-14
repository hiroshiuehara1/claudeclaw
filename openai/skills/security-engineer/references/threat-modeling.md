# Threat Modeling

Use this guide to structure threat analysis and prioritization.

## Threat Modeling Steps

1. Enumerate critical assets and sensitive operations.
2. Map trust boundaries and data/control flows.
3. Identify attacker goals and plausible abuse paths.
4. List threat scenarios per boundary and asset.
5. Score likelihood and impact.
6. Prioritize risks and map controls.

## Threat Categories

Consider these categories where relevant:
- Identity and authorization abuse
- Data exposure or exfiltration
- Integrity and tampering risk
- Availability and abuse amplification
- Supply chain and dependency compromise
- Misconfiguration and privilege escalation

## Risk Scoring

Use explicit scoring for prioritization:

```text
risk_score = likelihood_score * impact_score
```

Use a consistent scale and define threshold tiers for action urgency.

## Attacker Path Analysis

For high-priority risks, include:
- Initial access path
- Privilege movement/escalation path
- Target asset impact path
- Existing controls and bypass assumptions

## Output Requirements

Every top risk should include:
- Asset affected
- Trust boundary involved
- Likelihood and impact rationale
- Control plan and residual risk note
