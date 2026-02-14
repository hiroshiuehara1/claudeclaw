# Security Validation

Use this guide to verify that controls work before and after release.

## Validation Layers

Define checks across layers:
- Build-time: static checks, dependency checks, policy checks
- Deploy-time: configuration validation and secret policy checks
- Runtime: authz behavior, abuse-path checks, telemetry assertions

## Validation Types

Include relevant checks such as:
- Authentication and authorization misuse tests
- Input handling and security boundary tests
- Dependency and known-vulnerability checks
- Secret exposure and configuration safety checks
- Abuse-case and negative-path tests

## Gate Classification

Separate checks into:
- Blocking checks: must pass for release
- Advisory checks: tracked with explicit owner and remediation timeline

## Failure Handling

When a security check fails:
- Classify severity and exploitability
- Route to owner with SLA
- Decide release impact based on gate policy
- Record exception and expiry if shipping with risk

## Validation Quality Criteria

A strong validation plan is:
- Traceable to prioritized threats
- Measurable with objective pass/fail criteria
- Repeatable across environments
- Integrated into release decision workflow
