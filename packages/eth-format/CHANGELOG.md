# @blobscan/eth-format

## 0.1.1

### Patch Changes

- [#1049](https://github.com/Blobscan/blobscan/pull/1049) [`bc7c3a1`](https://github.com/Blobscan/blobscan/commit/bc7c3a1c29a29a8e0b77e615fbc2e4e2fcdfbd78) Thanks [@PJColombo](https://github.com/PJColombo)! - Add the USD fee metrics `totalBlobBaseFeeUsd`, `totalBlobAsCalldataFeeUsd` and `totalBlobMaxFeeUsd` to the metrics tables and to the stats endpoints. Also add `totalUsdPricedTransactions`, the count of the transactions that have a USD fee. Dagster converts the fee of each transaction at the ETH/USD price of the minute of its block, as the API does for a transaction, and then adds the results. A transaction with no price for its minute is not included, and a metric is `null` when no transaction in its group has a price.

  The calldata fee metrics (`totalBlobAsCalldataFee`, `avgBlobAsCalldataFee` and `totalBlobAsCalldataFeeUsd`) now use the gas price of the transaction, not the blob gas price, as the API does for a transaction. The old values are too low.

  The stats page shows the Total Blob Fees and Total Tx Fees Saved cards in USD. The Total Blob Base Fees and Avg. Blob Base Fee charts start in USD, and each chart has a toggle next to its Full View link that switches it to ETH. Their detail pages have the same toggle, and the URL keeps the unit (`?unit=usd`). The USD average is the total USD fee divided by `totalUsdPricedTransactions`, so a transaction with no price does not make the average too low. Formatted ETH amounts now show the unit as "Ether", not "ether".

  The new columns are empty after the migration. The price syncer must write one price each minute (`ETH_PRICE_SYNCER_CRON_PATTERN="* * * * *"`). Backfill `eth_usd_price` back to Dencun first, and then backfill the metrics partitions.

## 0.1.0

### Minor Changes

- [#598](https://github.com/Blobscan/blobscan/pull/598) [`05bdc1d`](https://github.com/Blobscan/blobscan/commit/05bdc1d0645bf510df211eb8c0d2bda63ffd1c76) Thanks [@PJColombo](https://github.com/PJColombo)! - Made unit display optional when formatting wei amounts
