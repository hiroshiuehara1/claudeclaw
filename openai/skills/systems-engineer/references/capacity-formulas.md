# Capacity Formulas

Use these formulas for required core estimates.

## Units and Conventions

- Use decimal units unless the user asks otherwise:
  - 1 KB = 10^3 bytes
  - 1 MB = 10^6 bytes
  - 1 GB = 10^9 bytes
- State whether estimates are pre-replication or post-replication.
- State peak multipliers explicitly.
- Round final values for readability, but keep formulas visible.

## Core Inputs

Define these inputs first:
- MAU: monthly active users
- DAU: daily active users
- Actions/day: operations per active user per day
- Write ratio and read ratio
- Avg record size (bytes)
- Avg payload size (bytes)
- Replication factor
- Retention period
- Peak multiplier
- Headroom multiplier

## Throughput

Average requests per second:

```text
avg_rps = (DAU * actions_per_user_per_day) / 86400
```

Peak requests per second:

```text
peak_rps = avg_rps * peak_multiplier
```

Read/write decomposition:

```text
write_rps = total_rps * write_ratio
read_rps  = total_rps * read_ratio
```

## Storage Growth

Daily writes:

```text
writes_per_day = DAU * writes_per_user_per_day
```

Daily storage growth (single copy):

```text
storage_per_day_bytes = writes_per_day * avg_record_size_bytes
```

Post-replication:

```text
storage_per_day_replicated = storage_per_day_bytes * replication_factor
```

Retention footprint:

```text
retained_storage = storage_per_day_replicated * retention_days
```

## Bandwidth

Average bandwidth:

```text
avg_bandwidth_bytes_per_sec = rps * avg_payload_size_bytes
```

Peak bandwidth:

```text
peak_bandwidth_bytes_per_sec = avg_bandwidth_bytes_per_sec * peak_multiplier
```

Convert to bits/sec when needed:

```text
bps = bytes_per_sec * 8
```

## Reliability and Recovery Capacity

Required spare capacity for failures:

```text
required_capacity = estimated_peak * headroom_multiplier
```

Simple N+1 intuition for stateless pools:

```text
instance_count_required = ceil(required_capacity / capacity_per_instance)
```

Recovery throughput check:

```text
recovery_time = backlog_size / net_drain_rate
```

Where:
- `net_drain_rate = processing_rate - incoming_rate`

## Baseline Defaults

Use these defaults only when missing:
- Peak multiplier: 3x to 5x
- Headroom multiplier: 2x
- Replication factor: 3
- Initial availability target: 99.9% unless business needs are stricter

Always label defaults as assumptions.
