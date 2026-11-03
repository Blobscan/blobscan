# @blobscan/dagster

## 0.5.0

### Minor Changes

- [#1053](https://github.com/Blobscan/blobscan/pull/1053) [`ce102bb`](https://github.com/Blobscan/blobscan/commit/ce102bb755b8578b9bdc1406a13f80063a9bce9f) Thanks [@PJColombo](https://github.com/PJColombo)! - Add the `updated_at` column to the hourly, daily, weekly, monthly and yearly metrics tables. Dagster sets it each time it aggregates a period. The timeseries stats endpoint gives `currentPeriod.updatedAt`, the time of the last update of the current period. The series do not include it as a metric.

  The chart tooltip of the current period shows a red pulse and "Live" next to the date, and the time of the last update below it (for example, "Updated 5 minutes ago"). The metrics docs describe the current period.

  The existing rows get the time of the migration as their update time.

### Patch Changes

- [#1055](https://github.com/Blobscan/blobscan/pull/1055) [`fab34cb`](https://github.com/Blobscan/blobscan/commit/fab34cb54ba58a24cf8f51e1bb5c7b0f6a592103) Thanks [@PabloCastellano](https://github.com/PabloCastellano)! - Fix HIGH/CRITICAL vulnerabilities reported by Trivy.

  - Dagster: upgrade the locked `certifi`, `cryptography`, `filelock`, `fsspec`, `mako`, `oauthlib`, `pyasn1` and `urllib3`
  - Raise the `follow-redirects` override to 1.16.2

## 0.4.0

### Minor Changes

- [#1050](https://github.com/Blobscan/blobscan/pull/1050) [`ae21d79`](https://github.com/Blobscan/blobscan/commit/ae21d79f10a2e4a82d78767f49d2797e9470f120) Thanks [@PJColombo](https://github.com/PJColombo)! - Added the `maxBlobGasPrice` and `minBlobGasPrice` metrics. Dagster calculates them from the blob gas price of the blocks in each period, and the stats endpoints return them in the global dimension. The Avg. Blob Gas Price chart is now the Blob Gas Price chart: it shows the maximum, the average and the minimum, with a band between the maximum and the minimum. Its full-view page moves from `/stat/avg-blob-gas-price` to `/stat/blob-gas-price`, and the old URL redirects to the new one.

  After the deploy, run a backfill of the `hourly_metrics` partitions to calculate these metrics for the old periods. The daily, weekly, monthly and yearly metrics update automatically after the hourly backfill.

- [#1048](https://github.com/Blobscan/blobscan/pull/1048) [`0cb02ec`](https://github.com/Blobscan/blobscan/commit/0cb02ec3290ec5794d19aefc3341a1d55102793e) Thanks [@PJColombo](https://github.com/PJColombo)! - Added the `maxEthPrice`, `minEthPrice` and `avgEthPrice` metrics. Dagster calculates them from the ETH/USD prices for each period, and the stats endpoints return them in the global dimension. The stats page shows them in a new ETH Price chart.

  After the deploy, run a backfill of the `hourly_metrics` partitions to calculate these metrics for the old periods. The daily, weekly, monthly and yearly metrics update automatically after the hourly backfill. Do the same after you load ETH prices that are more than 3 hours old (for example, after an ETH price syncer outage): the hourly catch-up schedule only calculates the last 3 hours again.

- [#1049](https://github.com/Blobscan/blobscan/pull/1049) [`bc7c3a1`](https://github.com/Blobscan/blobscan/commit/bc7c3a1c29a29a8e0b77e615fbc2e4e2fcdfbd78) Thanks [@PJColombo](https://github.com/PJColombo)! - Add the USD fee metrics `totalBlobBaseFeeUsd`, `totalBlobAsCalldataFeeUsd` and `totalBlobMaxFeeUsd` to the metrics tables and to the stats endpoints. Also add `totalUsdPricedTransactions`, the count of the transactions that have a USD fee. Dagster converts the fee of each transaction at the ETH/USD price of the minute of its block, as the API does for a transaction, and then adds the results. A transaction with no price for its minute is not included, and a metric is `null` when no transaction in its group has a price.

  The calldata fee metrics (`totalBlobAsCalldataFee`, `avgBlobAsCalldataFee` and `totalBlobAsCalldataFeeUsd`) now use the gas price of the transaction, not the blob gas price, as the API does for a transaction. The old values are too low.

  The stats page shows the Total Blob Fees and Total Tx Fees Saved cards in USD. The Total Blob Base Fees and Avg. Blob Base Fee charts start in USD, and each chart has a toggle next to its Full View link that switches it to ETH. Their detail pages have the same toggle, and the URL keeps the unit (`?unit=usd`). The USD average is the total USD fee divided by `totalUsdPricedTransactions`, so a transaction with no price does not make the average too low. Formatted ETH amounts now show the unit as "Ether", not "ether".

  The new columns are empty after the migration. The price syncer must write one price each minute (`ETH_PRICE_SYNCER_CRON_PATTERN="* * * * *"`). Backfill `eth_usd_price` back to Dencun first, and then backfill the metrics partitions.

## 0.3.0

### Minor Changes

- [#1033](https://github.com/Blobscan/blobscan/pull/1033) [`d3b4a09`](https://github.com/Blobscan/blobscan/commit/d3b4a0936cc14d896bf8b50d4c567603c85e43ac) Thanks [@PJColombo](https://github.com/PJColombo)! - Added the current period to the time series charts. `stats.getTimeseries` (`GET /stats/timeseries`) has a new optional `includeCurrentPeriod` input. When it is `true`, the response includes the current day, which is not complete, and gives its timestamp in `data.currentPeriod`. A line chart shows the current day as a dotted segment with a hollow point. A bar chart shows it as a dashed, lighter bar. The charts refresh it every 5 minutes. Dagster now updates the current daily, weekly, monthly and yearly metrics after each hourly update. A new schedule, which is running by default, updates `all_time_metrics` every 10 minutes

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
