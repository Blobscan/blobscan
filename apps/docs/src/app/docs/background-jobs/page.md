---
title: Background jobs
nextjs:
  metadata:
    title: Background jobs
    description: Blobscan background jobs
---

Blobscan requires [BullMQ](https://bullmq.io/) to run the following tasks in the background:

- `ETHPriceSyncer` - gets the ETH price in USD and stores it.

For more information, check out the [@blobscan/syncers](https://github.com/Blobscan/blobscan/tree/main/packages/syncers/src/syncers) package.

The BullMQ queue is also used to upload blobs in parallel to different Storages.

## Metrics

[Dagster](https://dagster.io/) calculates the metrics for the charts and the totals (for example, Total Tx Fees Saved, Total Blocks and Total Blobs). The pipeline writes the metrics to the `hourly_metrics`, `daily_metrics`, `weekly_metrics`, `monthly_metrics`, `yearly_metrics` and `all_time_metrics` tables. The API reads the metrics from these tables.

The metrics store the rollup of each row. The metrics keep the old attribution when the rollup of an address changes (for example, after a migration that labels a new batcher). After such a change, the metrics must be re-aggregated by hand from the first transaction of the changed addresses. See "Reprocessing after a rollup change" in the README.

For more information, refer to the [`apps/dagster`](https://github.com/Blobscan/blobscan/tree/main/apps/dagster) README.
