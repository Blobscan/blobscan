# Spec: address metrics and the new address page

## Terms

- **Sent**: the blob transactions where the address is `from`.
- **Received**: the blob transactions where the address is `to`.
- **Role**: sent or received. A self-send (`from = to`) counts in both roles.
- **Self-send**: a blob transaction where `from = to`. In production, 59,361 transactions are self-sends, and 1,727 addresses send only to themselves.
- **Self-sender**: an address whose received transactions are all self-sends. The page shows it as a sender only.
- **Blob base fee** and **Blob gas price** have the meanings in `CONTEXT.md`.
- **Closed day**: a UTC day that has ended.

## Goals

- Show metrics and timeseries charts for each address on the address page.
- Calculate the metrics in Dagster, in the same way as the current network metrics.
- Keep the current `*_metrics` tables and the `stats.*` procedures unchanged.

## Data model

### Tables

| Table | Key | Retention |
|---|---|---|
| `address_hourly_metrics` | `(address, period_start)` | 30 days |
| `address_daily_metrics` | `(address, period_start)` | Forever |
| `address_weekly_metrics` | `(address, period_start)` | Forever |
| `address_monthly_metrics` | `(address, period_start)` | Forever |
| `address_yearly_metrics` | `(address, period_start)` | Forever |
| `address_all_time_metrics` | `(address)` | Forever. Closed days only. |

- The unique key starts with `address`, because the page always filters by address.
- Add an index on `period_start` for `delete_window` and for the cleanup.
- A row exists only for a period in which the address has at least one transaction (sparse rows).
- Each table has an `updated_at` column.
- `address_all_time_metrics` has an `aggregated_until` column: the last closed day that the row includes.

### Columns

Each metric column is in the table two times: with the prefix `sent_` and with the prefix `received_`.

| Column (after the prefix) | Meaning |
|---|---|
| `total_transactions` | Blob transactions |
| `total_blobs` | Blobs |
| `total_blob_usage_size` | Blob bytes that contain data |
| `total_blob_base_fee` | Blob base fee paid, in wei |
| `total_blob_as_calldata_fee` | The fee that the same data costs as calldata, in wei |
| `total_blob_base_fee_usd` | Blob base fee in USD |
| `total_blob_as_calldata_fee_usd` | Calldata fee in USD |
| `total_usd_priced_transactions` | Transactions that have a USD price. Divide USD averages by this value. |
| `first_block_timestamp` | Timestamp of the first transaction in the period |
| `last_block_timestamp` | Timestamp of the last transaction in the period |

One more column has no prefix:

| Column | Meaning |
|---|---|
| `self_total_transactions` | Transactions where `from = to`. They are also in `sent_total_transactions` and in `received_total_transactions`. |
| `self_total_blobs` | Blobs of the transactions where `from = to`. They are also in `sent_total_blobs` and in `received_total_blobs`. |

- That is 21 metric columns, plus `id`, `address`, `period_start` and `updated_at` (25 columns). The daily, weekly, monthly and yearly tables have the same columns, and their `period_start` is a `DATE`. A week starts on Monday, as `DATE_TRUNC('week')`. The all-time table has no `period_start`, but has `aggregated_until` (24 columns).
- Do not store blob gas used or blob size. Each blob uses 131072 blob gas and has 131072 bytes, so the code calculates both values as `total_blobs × 131072`.
- Prisma field names follow the convention of the current metrics models.

### Rules

- Count only canonical transactions. Use `NOT EXISTS transaction_fork`, the same as `aggregate_tx_hourly.sql`.
- Calculate USD for each transaction with the ETH price of the block minute. Do not use an older price. If the minute has no price, the USD value is NULL and the transaction is not in `total_usd_priced_transactions`.
- Use the same fee formulas as `aggregate_tx_hourly.sql`.

## Dagster

### Assets

| Asset | Partitions | Reads | Writes |
|---|---|---|---|
| `address_hourly_metrics` | Hourly | Raw tables | `address_hourly_metrics` |
| `address_daily_metrics` | Daily | Raw tables | `address_daily_metrics` |
| `address_weekly_metrics` | Weekly | `address_daily_metrics` | `address_weekly_metrics` |
| `address_monthly_metrics` | Monthly | `address_daily_metrics` | `address_monthly_metrics` |
| `address_yearly_metrics` | Yearly | `address_monthly_metrics` | `address_yearly_metrics` |
| `address_all_time_metrics` | None | The yearly, monthly and daily tables | `address_all_time_metrics` |

- The raw tables are `transaction`, `block`, `blobs_on_transactions`, `blob`, `eth_usd_price` and `transaction_fork`.
- The hourly and daily assets use the same SQL with a different `DATE_TRUNC` (`hour` or `day`).
  - Group the transactions by `from_id` for the `sent_*` columns and by `to_id` for the `received_*` columns.
  - Combine the two with `UNION ALL`, then `GROUP BY address` with conditional `SUM`, `MIN` and `MAX`.
  - Calculate `self_total_transactions` in the `from_id` part with `COUNT(*) FILTER (WHERE from_id = to_id)`.
- The daily asset does not read the hourly table. Thus a daily partition can run again at any time, also for days older than 30 days.
- The weekly, monthly and yearly assets use one SQL (`aggregate_address_rollup.sql`) with a different source table and `DATE_TRUNC`. They are the same levels as the network metrics: daily → weekly, daily → monthly → yearly. All the metrics are sums, except `first_block_timestamp` (`MIN`) and `last_block_timestamp` (`MAX`), so each level has the same values as the transactions of its period.
- A week can have days in two months, so the all-time SQL does not read the weekly table.
- Use the same partition definitions as the current metrics assets (`end_offset=1`, start date from `DAGSTER_METRICS_START_DATE` or Dencun).
- Use the current write method: `delete_window`, then `INSERT … ON CONFLICT`, in one transaction.

### Updates

- **Hourly**: the asset declares a dependency on `hourly_metrics` and uses the same automation condition as the rollup levels. Thus each run of the live schedule (every 10 minutes) and of the catch-up schedule (the last 3 hours) also updates it. The asset does not read `hourly_metrics`.
- **Daily**: the current daily partition updates after each hourly run, with the same automation condition as `daily_metrics`. The daily asset declares a dependency on the hourly asset for this purpose only. It does not read the hourly data.
- **Weekly, monthly and yearly**: the same automation condition as the network levels (`rollup_condition`). Each partition, the current one too, runs again when one of its upstream partitions is updated. Thus the current week and month follow the current day, and a re-run of an old day also updates its week, its month and then its year.
- **All-time**: it includes closed days only. It runs when a daily, monthly or yearly partition that is not the latest one materializes. This occurs after a day, a month or a year closes, and after a catch-up or reorg run on a closed period.
  - The run deletes all rows, then inserts `SUM`, `MIN` and `MAX`, grouped by address, over the closed periods: the closed years of `address_yearly_metrics`, the closed months of the current year of `address_monthly_metrics`, and the closed days of the current month of `address_daily_metrics`. The network all-time metrics use the same levels.
  - This reads about one row for each address and closed year, plus the rows of the current year. A full read of the daily table would grow by about 86k rows each year at the current rate.
  - The run is a full refresh, so it corrects itself: after the levels below it update, the next run has the correct values.
  - At a month or a year boundary, the run can start before the month or the year updates. The update of that closed month or year then starts the run again.

### Hourly retention

- A cleanup schedule runs one time each day: `DELETE FROM address_hourly_metrics WHERE period_start < now() - interval '30 days'`.
- Guard: if a partition of `address_hourly_metrics` ends before the retention limit (now − 30 days), the asset does nothing and logs a warning. This prevents a "backfill all" that the cleanup then deletes. If a partition range starts before the limit and ends after it, the asset writes only the hours after the limit.

### Backfill

- Daily: the full history, with `BackfillPolicy.multi_run(30)` (30 days for each run).
- Hourly: the last 30 days only, with `BackfillPolicy.multi_run(24 × 7)` (7 days for each run).
- The two backfills do not depend on each other and can run at the same time.
- Weekly and monthly: after the daily backfill. Yearly: after the monthly backfill.
- After the yearly backfill, run the all-time asset one time.

## API

Add a new `address` router. Do not change `stats.*`.

Both procedures take `{ address, timeFrame }`. The address is changed to lower case. The default time frame is `All`.

### Granularity

- Use the hourly tables for `1d` and `7d`. Use the daily tables for the other time frames.
- A time frame has its closed periods and the current period. The values of the current period are partial.

### `address.getOverall({ address, timeFrame })`

- For `All`: read the all-time row, then add the daily rows with `period_start > aggregated_until`. These are the current day, and a closed day that the all-time asset did not include yet.
- For other time frames: sum the rows in the time frame, from the table of the granularity.
- Return:
  - `sent` and `received`: the raw totals of each role. The web calculates the derived metrics.
  - `selfTotalTransactions`.
  - `category` and `rollup` of the address. They are null when the address is not in the database.
  - `network`: the totals of the network-wide row (`category = NULL`, `rollup = NULL`) in the time frame. For `All`, they come from `all_time_metrics`.
  - `allTime`: values that do not depend on the time frame:
    - `totalTransactions`: `sent + received − self`, for `All`.
    - `activeDays`: the number of daily rows of the address (either role).
    - `longestStreak`: the largest number of consecutive active days.
    - `longestGap`: the largest number of days with no transactions between two active days. It is 0 when the address has fewer than two active days.
    - `firstTransaction` and `lastTransaction`.
  - `updatedAt`: the last update of the rows.
- The first and last transaction come from live index lookups on `transaction`, not from Dagster. Exclude forked transactions. The `[fromId, blockTimestamp, index]` and `[toId, blockTimestamp, index]` indexes support this.

### `address.getTimeseries({ address, timeFrame })`

- Return `{ granularity, timestamps, sent, received, selfTotalTransactions, selfTotalBlobs, network, updatedAt }`.
  - `sent` and `received` have one array for each role metric.
  - `network` has the arrays of the network-wide row: `totalBlobs`, `totalBlobBaseFee` and `totalBlobGasUsed`. The share and the timing ratio need them.
- The last timestamp is the current period. Its values are partial.
- For `All`, the first timestamp is the first period of the address, not the Dencun date.
- Fill the gaps with zeros, the same as `stats.getTimeseries`.

### Cache

- Cache each procedure for 60 seconds, keyed by address and input.

### `tx.getAll`

- Add an `address` filter that matches `from` OR `to`.
- The web compares the address with `from` and `to` to find the role of each transaction.

## Metrics

### Derived metrics

The web calculates these values. Most cards use the main role: the shown role with more transactions.

| Metric | Formula |
|---|---|
| Avg blobs per tx | `total_blobs ÷ total_transactions` |
| Avg blob fee per tx (ETH) | `total_blob_base_fee ÷ total_transactions` |
| Avg blob fee per tx (USD) | `total_blob_base_fee_usd ÷ total_usd_priced_transactions` |
| Blob utilization | `total_blob_usage_size ÷ (total_blobs × 131072)` |
| Cost per KiB of blob data | `total_blob_base_fee ÷ (total_blob_usage_size ÷ 1024)`, and the same in USD |
| Unused blob space | `total_blobs × 131072 − total_blob_usage_size` |
| Wasted blob fees | `total_blob_base_fee × (1 − utilization)`: the blob fees of the unused space |
| Calldata savings | `total_blob_as_calldata_fee − total_blob_base_fee`, and the same in USD |
| Avg data per tx | `total_blob_usage_size ÷ total_transactions` |
| Avg daily txs | The mean of the daily txs of the time frame, sent and received together. Days with no txs count as 0. The current day is not complete, so it is not in the mean, except when it is the only day. For an hourly time frame: the mean of the hourly txs × 24. |
| Avg daily blobs | The same as avg daily txs, with the blobs |
| Avg daily data | The same as avg daily txs, with the blob usage size of the main role |
| Max daily txs, blobs, data | The UTC day with the largest value in the time frame, and its date. Hourly periods are added into days. Txs and blobs use the two roles together. Data uses the main role. |
| Age | Full days from the first transaction of the address to now |
| Time active | `allTime.activeDays` |

### Metrics with the network-wide row

The network-wide row is the row of `hourly_metrics`, `daily_metrics` or `all_time_metrics` with `category = NULL` and `rollup = NULL`.

| Metric | Formula |
|---|---|
| Share of network blobs | `address total_blobs ÷ network totalBlobs` |
| Avg blob gas price paid (sent only) | `address blob base fee ÷ address blob gas` |
| Timing ratio (sent only) | `avg blob gas price paid ÷ (network totalBlobBaseFee ÷ network totalBlobGasUsed)` |

- Both sides of the timing ratio are weighted by gas. Do not use `avgBlobGasPrice`, because it is an average for each block.
- A ratio below 1 means that the address posts when blob gas costs less than the network average.

## Web

### Overview

The overview shows all-time values:

- the address, with an identicon and a copy button
- the category and the rollup label (if the address has them)
- **Blob Txs**: the first and the last transaction, each as a link with a relative time. The full date shows on hover. On narrow screens, the last transaction goes under the first one.

### Tabs

- Two tabs: **Transactions** (default) and **Analytics**. The tab is in the URL as `?tab=`.

### Transactions tab

- The list shows sent and received transactions together, with a "Sent" or "Received" mark on each transaction. It uses the new `address` filter of `tx.getAll`.
- The count in the title is `allTime.totalTransactions`. Thus each transaction counts one time, also a self-send.
- This fixes the earlier bug: the page called `tx.getAll` without `count: true`, so the count was empty.

### Analytics tab

The Analytics tab has six sections. The section is in the URL as `?section=`. The default section is Activity, and the URL does not show it.

**Control bar** (in the chart card of each section, except Activity)

- Time frame. The default is `All`.
- ETH/USD toggle, in the Fees section only. It is hidden on testnets, the same as on the stat pages.
- There is no role toggle.

**Roles shown on the page**

- In the selected time frame, the received role shows only if `received_total_transactions > self_total_transactions`. Thus a self-sender shows as a sender only.
- The sent role shows if `sent_total_transactions > 0`.

**Sections**

| Section | Cards | Charts |
|---|---|---|
| Activity | Age, Time Active, Longest Streak, Longest Gap (all-time, in days) | A calendar heatmap of the daily txs, one row for each year. An outline marks the longest streak. A color bar filters the days by the number of txs. |
| Transactions | Total Blob Txs (one card for each shown role), Avg. Daily Txs, Max Daily Txs | Blob Transactions |
| Blobs | Total Blobs (one card for each shown role, with the blob gas used), Avg. Blobs per Tx, Avg. Daily Blobs, Max Daily Blobs | Blobs |
| Blob Usage | Blob Space (full width: the utilization, and a bar with the used and the unused space), Avg. Data per Tx, Avg. Daily Data, Max Daily Data | Blob Size vs Usage |
| Fees | Total Blob Fees, Avg. Blob Fee per Tx, Cost per KiB of Blob Data, Calldata Savings, Wasted Blob Fees | Blob Fees, Cost per KiB of Blob Data |
| Network | Share of Network Blobs, Avg. Blob Gas Price Paid (only with sent txs, with the network price and the difference) | Share of Network Blobs (%), Timing Ratio vs Network |

- The fee cards show ETH, with the USD value under it when the network has an ETH price.
- The Network cards use all-time data. The time frame changes only the Network charts.
- Each card and each chart has a help text.

**Charts**

- **Blob Transactions** and **Blobs**: one bar for each period, which stacks the sent and the received values, and a dashed line with the mean for each period. The tooltip shows the total. The total of the txs counts a self-send one time.
- **Blobs** also has a line with the avg blobs per tx, on a second y-axis on the right.
- **Blob Size vs Usage**: the main role only, because the sender fills the blobs. The bars stack the data and the unused space. A line on the right y-axis shows the utilization (%).
- **Blob Fees**: a sent bar and a received bar, side by side.
- **Cost per KiB of Blob Data** and **Share of Network Blobs (%)**: one line for each role.
- **Timing Ratio vs Network**: sent only, with a reference line at 1.0.
- A series shows only if its role shows (see "Roles shown on the page").
- The charts use `ChartBase`. The legend is at the bottom.
- Always show the cards and the charts, also for an address with little activity.

### Known limitations

- For `All`, the address totals include the current day, but `all_time_metrics` has closed days only. Thus the share of network blobs for `All` compares slightly different periods.

## Tests

- The Dagster tests are in `apps/dagster/tests/test_address_assets.py` and `test_address_automation.py`. They calculate the expected rows in Python from `db-fixtures.json`, the same as the current tests.
- Test cases:
  - all columns, for each role, at the hourly, daily, weekly, monthly, yearly and all-time levels
  - a week with days in two months
  - reorg: a forked transaction is not counted
  - self-send: the transaction counts in both roles and in `self_total_transactions`
  - the hourly guard: a partition older than 30 days does nothing
  - the 30-day cleanup
  - all-time: closed days only, and `aggregated_until`
  - all-time: the closed years come from the yearly rows, and the daily rows of a closed year are not counted again
  - the automation conditions of the address assets
- Add to the fixtures:
  - an address that only receives
  - an address that both sends and receives
  - a self-send
  - a self-sender (an address that sends only to itself)
- Web tests: the role rule that hides the received role of a self-sender, the derived metrics, the daily means, the peak day, the day count of the cards, and the chart axes and tooltip totals.
- API tests in `packages/api/test/address/address.test.ts`: `address.getOverall` (`All` and other time frames, including the gap after `aggregated_until`), the longest streak and gap, `address.getTimeseries`, and the `address` filter of `tx.getAll`.

## Out of scope

- Counterparty metrics: unique senders, top senders, "Posts to", poster history and concentration. These need a table for each sender–receiver pair.
- Fee headroom and the max fee columns.
- Blob gas used and blob size columns (calculated from `total_blobs`).
- Blob storage breakdown for each address.

## Data volume (production)

The rows of each table for the full history, from Mar 13, 2024 to Nov 9, 2026 (972 days). One row is one address in one period, for the two roles together.

| Table | Rows | New rows each year at the current rate |
|---|---|---|
| `address_daily_metrics` | 160,192 | ~86k (about 238 addresses each day) |
| `address_weekly_metrics` | 36,111 | ~18k |
| `address_monthly_metrics` | 17,172 | ~9k |
| `address_yearly_metrics` | 10,279 | about the addresses active in the year |
| `address_all_time_metrics` | 9,791 | the new addresses |

- `address_hourly_metrics` (30 days): at most about 170k rows (24 rows for each address and day), and fewer, because most addresses are not active in each hour.
- The numbers come from this query on the production database:

```sql
WITH txs AS (
  SELECT tx.block_timestamp, tx.from_id, tx.to_id
  FROM transaction tx
  WHERE NOT EXISTS (
    SELECT 1 FROM transaction_fork tx_f
    WHERE tx_f.block_hash = tx.block_hash AND tx_f.hash = tx.hash
  )
),
addresses AS (
  SELECT block_timestamp, from_id AS address FROM txs
  UNION ALL
  SELECT block_timestamp, to_id FROM txs
)
SELECT
  COUNT(DISTINCT (DATE_TRUNC('day',   block_timestamp), address)) AS daily_rows,
  COUNT(DISTINCT (DATE_TRUNC('week',  block_timestamp), address)) AS weekly_rows,
  COUNT(DISTINCT (DATE_TRUNC('month', block_timestamp), address)) AS monthly_rows,
  COUNT(DISTINCT (DATE_TRUNC('year',  block_timestamp), address)) AS yearly_rows,
  COUNT(DISTINCT address)                                         AS all_time_rows
FROM addresses;
```

## Delivery

- Start from `origin/main`.
- One PR has the Prisma migration, the Dagster assets, the `address` router, the `tx.getAll` filter and the web page.
- Changesets are `minor`.
