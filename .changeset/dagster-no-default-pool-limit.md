---
"@blobscan/dagster": patch
---

Remove `concurrency.pools.default_limit` from the Dagster instance config: with Postgres storage it fails with `InFailedSqlTransaction` when a pool row already exists. Pool limits are now set explicitly
