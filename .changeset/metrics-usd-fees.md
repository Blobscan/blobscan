---
"@blobscan/db": minor
"@blobscan/dagster": minor
"@blobscan/api": minor
---

Add the USD fee metrics `totalBlobBaseFeeUsd`, `totalBlobAsCalldataFeeUsd` and `totalBlobMaxFeeUsd` to the metrics tables and to the stats endpoints. Dagster converts the fee of each transaction at the most recent ETH/USD price at or before its block time, and then adds the results. A metric is `null` when no ETH/USD price is available for its period.

The new columns are empty after the migration. Backfill the metrics partitions to fill them.
