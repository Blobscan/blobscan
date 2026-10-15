---
"@blobscan/dagster": patch
---

Replace metrics rows within the partition window on re-aggregation so reorged or removed groups no longer leave stale rows, and re-aggregate the last 3 hours in the hourly catch-up schedule
