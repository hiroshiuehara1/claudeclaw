# Capacity Formulas

Use these formulas for required core data engineering estimates.

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
- Compression ratio (if applicable)
- Replication factor (if applicable)
- Processing throughput per worker/job
- Available compute window

## Ingest Volume

Daily ingest bytes:

```text
daily_ingest_bytes = records_per_day * avg_record_size_bytes
```

Peak ingest rate:

```text
avg_ingest_rps = records_per_day / 86400
peak_ingest_rps = avg_ingest_rps * peak_multiplier
```

## Storage Growth

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

## Processing Envelope

Estimated runtime for batch workload:

```text
runtime_seconds = total_records_to_process / effective_processing_rate_records_per_sec
```

Catch-up feasibility check:

```text
slack_seconds = available_window_seconds - runtime_seconds
```

If `slack_seconds < 0`, redesign is required.

## Backfill Runtime

Backfill duration estimate:

```text
backfill_seconds = backlog_records / net_processing_rate
```

Where:

```text
net_processing_rate = processing_rate - incoming_rate
```

If `net_processing_rate <= 0`, backlog cannot drain.

## Cost Primitives

Scan-cost proxy:

```text
daily_scan_bytes = query_runs_per_day * avg_bytes_scanned_per_run
```

Compute-cost proxy:

```text
daily_compute_units = avg_runtime_hours_per_run * runs_per_day * compute_unit_rate
```

Use these for relative comparison when exact pricing is unavailable.

## Defaults (Only When Missing)

- Peak multiplier: 3x
- Headroom: 2x
- Initial retention assumption: 365 days
- Compression ratio assumption: 3x

Always label defaults as assumptions.
