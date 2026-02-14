# Capacity Formulas

Use these formulas for required core data engineering estimates across streaming and batch paths.

## Units and Conventions

- Use decimal units unless the user asks otherwise:
  - 1 KB = 10^3 bytes
  - 1 MB = 10^6 bytes
  - 1 GB = 10^9 bytes
  - 1 TB = 10^12 bytes
- State whether values are raw, compressed, or replicated.
- Keep formulas visible and round final values for readability.

## Core Inputs

Define first:
- Events/records per day
- Average record size (bytes)
- Peak multiplier
- Retention period
- Compression ratio
- Replication factor
- Processing throughput per consumer/worker
- Available compute window
- Stateful key cardinality and per-key state size

## Ingest Volume and Throughput

Daily ingest bytes:

```text
daily_ingest_bytes = records_per_day * avg_record_size_bytes
```

Average and peak ingress rate:

```text
avg_ingest_rps = records_per_day / 86400
peak_ingest_rps = avg_ingest_rps * peak_multiplier
```

## End-to-End Latency Budget

Budget decomposition:

```text
e2e_latency = source_to_ingest + ingest_to_process + process_to_serve
```

Use this to verify stage-level allocations meet target latency SLO.

## Storage and State Growth

Raw daily growth:

```text
raw_storage_per_day = daily_ingest_bytes
```

Compressed daily growth:

```text
compressed_storage_per_day = raw_storage_per_day / compression_ratio
```

Retention footprint:

```text
retained_storage = compressed_storage_per_day * retention_days * replication_factor
```

Estimated stream state size:

```text
state_size_bytes = active_keys * avg_state_bytes_per_key
```

## Lag and Recovery

Lag growth rate when incoming exceeds processing:

```text
lag_growth_rps = incoming_rps - processing_rps
```

Backlog drain rate:

```text
net_drain_rps = processing_rps - incoming_rps
```

Backlog recovery time:

```text
recovery_seconds = backlog_events / net_drain_rps
```

If `net_drain_rps <= 0`, backlog cannot drain.

## Batch and Replay Runtime

Batch runtime estimate:

```text
runtime_seconds = total_records_to_process / effective_processing_rate_records_per_sec
```

Replay duration estimate:

```text
replay_seconds = replay_backlog_records / replay_net_processing_rate
```

## Cost Proxies

Stream compute proxy:

```text
stream_compute_units_per_day = avg_processing_units * 24
```

Query/scan proxy:

```text
daily_scan_bytes = query_runs_per_day * avg_bytes_scanned_per_run
```

Storage cost proxy:

```text
storage_units = retained_storage / bytes_per_storage_unit
```

Use these for relative comparisons when exact pricing is unavailable.

## Defaults (Only When Missing)

- Peak multiplier: 3x
- Headroom: 2x
- Initial retention assumption: 365 days
- Compression ratio assumption: 3x
- Default lag alert threshold: 2x steady-state median lag

Always label defaults as assumptions.
