---
"@blobscan/dagster": minor
"@blobscan/docs": patch
---

Add asset checks to the network metrics. They compare the hourly counts with the source tables, each rollup level with the level it is aggregated from, and the category and rollup rows of each hour with their totals. A freshness check fails when the newest aggregated block is older than `DAGSTER_METRICS_MAX_LAG_MINUTES` (default 60). The checks run from a cron automation condition, and the scheduled jobs no longer run checks with their assets. A new `metrics_check_alert` sensor (stopped by default) alerts once when a check fails and once when it passes again, and waits for running backfills to end before it reports consistency failures.
