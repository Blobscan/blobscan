---
"@blobscan/db": minor
"@blobscan/dagster": minor
"@blobscan/api": minor
"@blobscan/web": minor
"@blobscan/eth-format": patch
---

Add the USD fee metrics `totalBlobBaseFeeUsd`, `totalBlobAsCalldataFeeUsd` and `totalBlobMaxFeeUsd` to the metrics tables and to the stats endpoints. Dagster converts the fee of each transaction at the ETH/USD price of the minute of its block, as the API does for a transaction, and then adds the results. A transaction with no price for its minute is not included, and a metric is `null` when no transaction in its group has a price.

The calldata fee metrics (`totalBlobAsCalldataFee`, `avgBlobAsCalldataFee` and `totalBlobAsCalldataFeeUsd`) now use the gas price of the transaction, not the blob gas price, as the API does for a transaction. The old values are too low.

The stats page shows the Total Blob Fees and Total Tx Fees Saved cards in USD. The Total Blob Base Fees and Avg. Blob Base Fee charts start in USD, and the unit in their title is a toggle that switches the chart to ETH. Their detail pages have the same toggle, and the URL keeps the unit (`?unit=usd`). The USD average is the total USD fee divided by the number of transactions. Formatted ETH amounts now show the unit as "Ether", not "ether".

The new columns are empty after the migration. The price syncer must write one price each minute (`ETH_PRICE_SYNCER_CRON_PATTERN="* * * * *"`). Backfill `eth_usd_price` back to Dencun first, and then backfill the metrics partitions.
