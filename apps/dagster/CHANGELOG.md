# @blobscan/dagster

## 0.2.2

### Patch Changes

- [#1028](https://github.com/Blobscan/blobscan/pull/1028) [`b9e38b8`](https://github.com/Blobscan/blobscan/commit/b9e38b8b90cf354ea306f543f7d8f0679a802415) Thanks [@PJColombo](https://github.com/PJColombo)! - Replaced the legacy `daily_stats` and `overall_stats` tables with the metrics tables that Dagster populates. The stats endpoints and the counts now read `daily_metrics` and `all_time_metrics`. Removed the legacy stats syncers, the stats aggregation CLI and the legacy parity check. The stats endpoints use the new metric names (for example, `totalBlobFee` is now `totalBlobBaseFee`), and their values can be `null`

## 0.2.1

### Patch Changes

- [`00825bc`](https://github.com/Blobscan/blobscan/commit/00825bcfa42547194293452603d1864080a076d7) Thanks [@PabloCastellano](https://github.com/PabloCastellano)! - Remove `concurrency.pools.default_limit` from the Dagster instance config: with Postgres storage it fails with `InFailedSqlTransaction` when a pool row already exists. Pool limits are now set explicitly

- [#1017](https://github.com/Blobscan/blobscan/pull/1017) [`332f0b9`](https://github.com/Blobscan/blobscan/commit/332f0b9edd8d4195223e24317101b01d479b7f85) Thanks [@PabloCastellano](https://github.com/PabloCastellano)! - Made the metrics `avg_*` columns Postgres stored generated columns (total / count of the same row) and removed the average calculations from the Dagster aggregation SQL

## 0.2.0

### Minor Changes

- [#1022](https://github.com/Blobscan/blobscan/pull/1022) [`3d43190`](https://github.com/Blobscan/blobscan/commit/3d431905cba50d5ce598cdd0efafacef5e0d8f74) Thanks [@PabloCastellano](https://github.com/PabloCastellano)! - Added a `backfill_failure_alert` sensor that reports backfills ending FAILED or COMPLETED_FAILED to DAGSTER_ALERT_WEBHOOK_URL

### Patch Changes

- [#1019](https://github.com/Blobscan/blobscan/pull/1019) [`9514f99`](https://github.com/Blobscan/blobscan/commit/9514f995dcd428945f4da50a9e34f3c66ab8e85e) Thanks [@PabloCastellano](https://github.com/PabloCastellano)! - Upgrade Dagster to 1.13.26 to fix a Postgres connection leak that exhausted the database's connections during backfills, and move the run concurrency limits under `concurrency.runs` so the instance config loads

## 0.1.0

### Minor Changes

- [#969](https://github.com/Blobscan/blobscan/pull/969) [`e9f545d`](https://github.com/Blobscan/blobscan/commit/e9f545d73158b44b638dd8a56451ca84a17964fb) Thanks [@PabloCastellano](https://github.com/PabloCastellano)! - Added run failure and hourly_metrics staleness alerts (optional Slack-compatible webhook), a daily_metrics asset check comparing against legacy daily_stats, per-table run concurrency limits, and a shared Postgres engine per resource

### Patch Changes

- [#969](https://github.com/Blobscan/blobscan/pull/969) [`e9f545d`](https://github.com/Blobscan/blobscan/commit/e9f545d73158b44b638dd8a56451ca84a17964fb) Thanks [@PabloCastellano](https://github.com/PabloCastellano)! - Documented the initial metrics backfill and reprocessing after SQL changes

- [#969](https://github.com/Blobscan/blobscan/pull/969) [`e9f545d`](https://github.com/Blobscan/blobscan/commit/e9f545d73158b44b638dd8a56451ca84a17964fb) Thanks [@PabloCastellano](https://github.com/PabloCastellano)! - Replace metrics rows within the partition window on re-aggregation so reorged or removed groups no longer leave stale rows, and re-aggregate the last 3 hours in the hourly catch-up schedule

- [#969](https://github.com/Blobscan/blobscan/pull/969) [`e9f545d`](https://github.com/Blobscan/blobscan/commit/e9f545d73158b44b638dd8a56451ca84a17964fb) Thanks [@PabloCastellano](https://github.com/PabloCastellano)! - Replaced live metrics sensors with schedules that derive partition keys from the partition definitions, unblocked all-time metrics from missing upstream partitions, forwarded DATABASE_URL/CHAIN_ID and the Docker network to run containers, validated CHAIN_ID, and stopped the integration setup from creating migrations

- [#969](https://github.com/Blobscan/blobscan/pull/969) [`e9f545d`](https://github.com/Blobscan/blobscan/commit/e9f545d73158b44b638dd8a56451ca84a17964fb) Thanks [@PabloCastellano](https://github.com/PabloCastellano)! - Computed all-time averages from totals, bucketed hourly blob metrics by `blobs_on_transactions.block_timestamp`, returned `NULL` instead of `0` for empty hourly averages, ran metrics writes through a single `PostgresResource.transaction()` helper, validated the aggregate SQL template and bumped Postgres to 17 in local compose and CI

- [#969](https://github.com/Blobscan/blobscan/pull/969) [`e9f545d`](https://github.com/Blobscan/blobscan/commit/e9f545d73158b44b638dd8a56451ca84a17964fb) Thanks [@PabloCastellano](https://github.com/PabloCastellano)! - Fixed dagster lint, type-check and test failures in CI

- [#969](https://github.com/Blobscan/blobscan/pull/969) [`e9f545d`](https://github.com/Blobscan/blobscan/commit/e9f545d73158b44b638dd8a56451ca84a17964fb) Thanks [@PabloCastellano](https://github.com/PabloCastellano)! - Aligned weekly sensor and weekly partition start date to Monday-based weeks, and fixed stale Prisma schema paths in integration test setup
