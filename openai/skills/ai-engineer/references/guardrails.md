# Guardrails

Use this guide to enforce policy and safety boundaries in AI runtime behavior.

## Input Guardrails

Define checks for:
- Prompt injection patterns
- Policy-violating requests
- Sensitive data handling constraints
- Tool-call intent validation

## Output Guardrails

Define controls for:
- Unsafe or policy-violating content
- Unsupported claims and hallucinations
- Missing citations where grounding is required
- Required refusal or escalation behavior

## Tool-Use Guardrails

For each tool/action define:
- Allowed actions
- Parameter constraints
- Confirmation requirements for high-risk operations
- Audit logging expectations

## Defense-in-Depth

Apply layered controls:
- Pre-generation checks
- Runtime policy checks
- Post-generation validators
- Safe fallback when checks fail

## Red-Team and Abuse Cases

Maintain a focused adversarial set:
- Injection attempts
- Context poisoning attempts
- Policy bypass attempts
- Unauthorized tool invocation attempts
