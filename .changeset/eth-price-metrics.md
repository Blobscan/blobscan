---
"@blobscan/api": minor
"@blobscan/dagster": minor
"@blobscan/db": minor
"@blobscan/web": minor
---

Added the `maxEthPrice`, `minEthPrice` and `avgEthPrice` metrics. Dagster calculates them from the ETH/USD prices for each period, and the stats endpoints return them in the global dimension. The stats page shows them in a new ETH Price chart.

After the deploy, run a backfill of the `hourly_metrics` partitions to calculate these metrics for the old periods. The daily, weekly, monthly and yearly metrics update automatically after the hourly backfill. Do the same after you load ETH prices that are more than 3 hours old (for example, after an ETH price syncer outage): the hourly catch-up schedule only calculates the last 3 hours again.
