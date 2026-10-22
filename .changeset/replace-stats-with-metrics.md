---
"@blobscan/api": major
"@blobscan/db": minor
"@blobscan/web": minor
"@blobscan/syncers": minor
"@blobscan/env": minor
"@blobscan/rest-api-server": minor
"@blobscan/dagster": patch
"@blobscan/docs": patch
---

Replaced the legacy `daily_stats` and `overall_stats` tables with the metrics tables that Dagster populates. The stats endpoints and the counts now read `daily_metrics` and `all_time_metrics`. Removed the legacy stats syncers, the stats aggregation CLI and the legacy parity check. The stats endpoints use the new metric names (for example, `totalBlobFee` is now `totalBlobBaseFee`), and their values can be `null`
