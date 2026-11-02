---
"@blobscan/db": minor
"@blobscan/dagster": minor
"@blobscan/api": minor
---

Add the USD fee metrics `totalBlobBaseFeeUsd`, `totalBlobAsCalldataFeeUsd` and `totalBlobMaxFeeUsd` to the metrics tables and to the stats endpoints. Dagster converts the fee of each transaction at the ETH/USD price of the minute of its block, as the API does for a transaction, and then adds the results. A transaction with no price for its minute is not included, and a metric is `null` when no transaction in its group has a price.

The new columns are empty after the migration. The price syncer must write one price each minute (`ETH_PRICE_SYNCER_CRON_PATTERN="* * * * *"`). Backfill `eth_usd_price` back to Dencun first, and then backfill the metrics partitions.
