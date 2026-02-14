# Event Semantics

Use this guide to define correctness semantics for streaming data systems.

## Semantic Dimensions

Define explicitly:
- Event-time: when business event occurred
- Processing-time: when system processed event
- Ingestion-time: when event entered platform

Prefer event-time semantics for business correctness-sensitive metrics.

## Ordering and Duplication

Document assumptions:
- Ordering scope (global, partition-level, none)
- Duplicate event probability and sources
- Correction/update event behavior

Define dedupe keys and windows when at-least-once delivery is used.

## Lateness and Watermarks

For each stream, define:
- Expected lateness distribution
- Watermark policy (fixed or adaptive)
- Allowed lateness window
- Handling policy for beyond-window events

## Exactly-Once vs Idempotent Effects

If true exactly-once is not feasible, document:
- At-least-once processing behavior
- Idempotent write strategy
- Dedupe and reconciliation controls

## Correctness Acceptance Criteria

A correct semantic plan includes:
- Explicit event-time field ownership
- Explicit late and out-of-order behavior
- Explicit duplicate and correction handling
- Explicit validation checks tied to these behaviors
