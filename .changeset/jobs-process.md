---
"@blobscan/docs": minor
"@blobscan/env": minor
"@blobscan/jobs": minor
"@blobscan/rest-api-server": minor
---

Move the background jobs out of the REST API into a separate jobs process.

- Add the `@blobscan/jobs` app (it replaces the `@blobscan/syncers` package) and the `blossomlabs/blobscan-jobs` Docker image.
- Schedule the jobs with an in-process cron. The jobs process does not use Redis or BullMQ.
- Rename `ETHPriceSyncer` to `EthPriceJob`.
- Rename the `ETH_PRICE_SYNCER_*` env variables to `ETH_PRICE_JOB_*`. The old names are deprecated, but the jobs process still reads them.
- Add the `SENTRY_DSN_JOBS` env variable.
- The REST API does not run the jobs.
