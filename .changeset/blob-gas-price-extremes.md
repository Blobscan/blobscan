---
"@blobscan/api": minor
"@blobscan/dagster": minor
"@blobscan/db": minor
"@blobscan/web": minor
---

Added the `maxBlobGasPrice` and `minBlobGasPrice` metrics. Dagster calculates them from the blob gas price of the blocks in each period, and the stats endpoints return them in the global dimension. The Avg. Blob Gas Price chart is now the Blob Gas Price chart: it shows the maximum, the average and the minimum, with a band between the maximum and the minimum. Its full-view page moves from `/stat/avg-blob-gas-price` to `/stat/blob-gas-price`, and the old URL redirects to the new one.

After the deploy, run a backfill of the `hourly_metrics` partitions to calculate these metrics for the old periods. The daily, weekly, monthly and yearly metrics update automatically after the hourly backfill.
