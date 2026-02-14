# Test Design

Use these methods to design high-signal tests with minimal redundancy.

## Core Techniques

Apply these techniques as appropriate:
- Equivalence partitioning
- Boundary value analysis
- State transition testing
- Decision table testing
- Pairwise/combinatorial testing
- Negative/error-path testing

## Requirement-to-Test Mapping

For critical requirements, map:
- Requirement or acceptance criterion
- Test objective
- Test layer
- Expected failure mode

This mapping should be explicit in final output.

## Change-Impact Strategy

When scope changes, update tests by impact:
- Changed code/config paths
- Affected dependencies and interfaces
- Highest-risk user journeys

Avoid full-suite default unless risk justifies it.

## Regression Pack Guidance

Define packs by confidence and speed:
- Smoke: fast, high-signal sanity
- Critical-path: release-blocking journeys
- Extended regression: broader functional confidence

Align pack usage to release cadence and risk profile.

## Test Case Quality Checks

A high-quality test case should include:
- Intent and risk target
- Deterministic setup and prerequisites
- Clear expected result and oracle
- Cleanup/reset expectations
