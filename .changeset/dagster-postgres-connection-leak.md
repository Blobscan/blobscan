---
"@blobscan/dagster": patch
---

Upgrade Dagster to 1.13.26 to fix a Postgres connection leak that exhausted the database's connections during backfills, and move the run concurrency limits under `concurrency.runs` so the instance config loads
