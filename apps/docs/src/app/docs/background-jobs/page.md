---
title: Background jobs
nextjs:
  metadata:
    title: Background jobs
    description: Blobscan background jobs
---

## Jobs process

The jobs process runs the recurring jobs. It is a separate process from the API. It runs these jobs:

- `EthPriceJob` - gets the ETH price in USD and stores it.

Each job runs on a cron pattern. If a run is still active at the next tick, the job skips that tick. If a run fails, the process logs the error and sends it to Sentry. The next tick runs the job again.

Run one replica of the jobs process. The process does not apply the database migrations. Start it after the API applied them.

For more information, check out the [`apps/jobs`](https://github.com/Blobscan/blobscan/tree/main/apps/jobs) app.

### Run the jobs process

To run the jobs process locally, set `ETH_PRICE_JOB_ENABLED=true` and `ETH_PRICE_JOB_CHAIN_JSON_RPC_URL` in your `.env` file. Then run:

```bash
pnpm --filter @blobscan/jobs dev
```

`pnpm dev` also starts the jobs process with the API and the web app.

With Docker, use the `blossomlabs/blobscan-jobs` image. The `docker-compose.yml` file has a `jobs` service.

If no job is enabled, the process logs a warning and stops. If an enabled job does not have its required variables, the process stops with an error.

### Upgrade from an earlier release

In earlier releases, the API ran the jobs. To upgrade:

1. Add the `jobs` service to your deployment. With the `docker-compose.yml` file, set `BLOBSCAN_JOBS_TAG`.
2. Rename the `ETH_PRICE_SYNCER_*` variables to `ETH_PRICE_JOB_*`. The jobs process still reads the old names and logs a warning for each one.
3. If Swarm storage is enabled, set `SWARM_BATCH_ID`. The Swarm stamp job was removed, and Blobscan now reads the batch ID from this variable.

## Blob propagator

The blob propagator uses a [BullMQ](https://bullmq.io/) queue to upload blobs in parallel to different storages.

## Metrics

[Dagster](https://dagster.io/) calculates the metrics for the charts and the totals (for example, Total Tx Fees Saved, Total Blocks and Total Blobs). The pipeline writes the metrics to the `hourly_metrics`, `daily_metrics`, `weekly_metrics`, `monthly_metrics`, `yearly_metrics` and `all_time_metrics` tables. The API reads the metrics from these tables.

For more information, refer to the [`apps/dagster`](https://github.com/Blobscan/blobscan/tree/main/apps/dagster) README.
