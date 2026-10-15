---
"@blobscan/dagster": patch
---

Computed all-time averages from totals, bucketed hourly blob metrics by `blobs_on_transactions.block_timestamp`, returned `NULL` instead of `0` for empty hourly averages, ran metrics writes through a single `PostgresResource.transaction()` helper, validated the aggregate SQL template and bumped Postgres to 17 in local compose and CI
