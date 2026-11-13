---
"@blobscan/dagster": minor
---

Add `metrics_late_data_sensor`, which re-aggregates the hours of `hourly_metrics` that the indexer changed after they were aggregated, for example after an outage of the indexer. It looks at the last 30 days, waits until the indexer has not written to an hour for 15 minutes, starts one run per range of changed hours (at most one week each), and alerts once per range. The rollup levels follow through their automation conditions. The sensor is stopped by default.
