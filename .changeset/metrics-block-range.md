---
"@blobscan/db": minor
"@blobscan/dagster": minor
---

Add the block range to the hourly, daily, weekly, monthly, yearly and all-time metrics tables: `first_block_number`, `last_block_number`, `first_slot`, `last_slot`, `first_epoch`, `last_epoch`, `first_block_timestamp` and `last_block_timestamp`. Dagster sets them each time it aggregates a period.

Each row gets the range of its own transactions, thus a category or a rollup row can have a smaller range than the global row. The epoch comes from the block, and it is NULL when the block has no epoch.

The existing rows have NULL values until Dagster aggregates their periods again.
