# Test Data and Environments

Use this guide to make test execution reproducible and meaningful.

## Environment Tiers

Define clear tiers:
- Local/dev or ephemeral test env
- Integration/staging env
- Pre-production/canary env

For each tier, define data sources, dependencies, and fidelity limits.

## Test Data Strategy

Choose data strategy by risk and compliance:
- Synthetic data for broad safety and deterministic scenarios
- Masked production-like data for realism when required
- Seed datasets for baseline regression reproducibility

## Isolation and Reset

Require controls to avoid cross-test contamination:
- Unique test identifiers/namespaces
- Transaction rollbacks or environment reset hooks
- Idempotent setup and teardown patterns

## Versioning and Reproducibility

For stable automation:
- Version seed data and fixtures
- Pin external dependency versions where possible
- Record environment and dataset version in test reports

## Flake Prevention

Common controls:
- Avoid hidden timing dependencies
- Use explicit waits/signals, not arbitrary sleeps
- Minimize shared mutable state across tests
