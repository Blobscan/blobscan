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

- That is 21 metric columns, plus `id`, `address`, `period_start` and `updated_at` (25 columns). The all-time table has no `period_start`, but has `aggregated_until` (24 columns).
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
| `address_all_time_metrics` | None | `address_daily_metrics` | `address_all_time_metrics` |

- The raw tables are `transaction`, `block`, `blobs_on_transactions`, `blob`, `eth_usd_price` and `transaction_fork`.
- The hourly and daily assets use the same SQL with a different `DATE_TRUNC` (`hour` or `day`).
  - Group the transactions by `from_id` for the `sent_*` columns and by `to_id` for the `received_*` columns.
  - Combine the two with `UNION ALL`, then `GROUP BY address` with conditional `SUM`, `MIN` and `MAX`.
  - Calculate `self_total_transactions` in the `from_id` part with `COUNT(*) FILTER (WHERE from_id = to_id)`.
- The daily asset does not read the hourly table. Thus a daily partition can run again at any time, also for days older than 30 days.
- Use the same partition definitions as the current metrics assets (`end_offset=1`, start date from `DAGSTER_METRICS_START_DATE` or Dencun).
- Use the current write method: `delete_window`, then `INSERT … ON CONFLICT`, in one transaction.

### Updates

- **Hourly**: the asset declares a dependency on `hourly_metrics` and uses the same automation condition as the rollup levels. Thus each run of the live schedule (every 10 minutes) and of the catch-up schedule (the last 3 hours) also updates it. The asset does not read `hourly_metrics`.
- **Daily**: the current daily partition updates after each hourly run, with the same automation condition as `daily_metrics`. The daily asset declares a dependency on the hourly asset for this purpose only. It does not read the hourly data.
- **All-time**: it includes closed days only. It runs with eager automation when a daily partition that is not the latest one materializes. This occurs after the day closes, and after a catch-up or reorg run on a closed day.
  - The run deletes all rows, then inserts `SUM`, `MIN` and `MAX` over `address_daily_metrics` with `period_start <= aggregated_until`, grouped by address.

### Hourly retention

- A cleanup schedule runs one time each day: `DELETE FROM address_hourly_metrics WHERE period_start < now() - interval '30 days'`.
- Guard: if a partition of `address_hourly_metrics` is older than 30 days, the asset does nothing and logs a warning. This prevents a "backfill all" that the cleanup then deletes.

### Backfill

- Daily: the full history, with `BackfillPolicy.multi_run(30)` (30 days for each run).
- Hourly: the last 30 days only.
- The two backfills do not depend on each other and can run at the same time.
- After the daily backfill, run the all-time asset one time.

## API

Add a new `address` router. Do not change `stats.*`.

### `address.getOverall({ address, timeFrame })`

- For `All`: read the all-time row, then add the daily rows with `period_start > aggregated_until`. These are the current day, and a closed day that the all-time asset did not include yet.
- For other time frames: sum the daily rows in the time frame.
- Return the values for each role, the derived metrics, and the header values.
- The first and last transaction come from live index lookups on `transaction`, not from Dagster. Exclude forked transactions. The `[fromId, blockTimestamp, index]` and `[toId, blockTimestamp, index]` indexes support this.

### `address.getTimeseries({ address, metrics, timeFrame })`

- Use the hourly table for `1d` and `7d`. Use the daily table for the other time frames.
- Return the same shape as `stats.getTimeseries`: `{ granularity, timestamps, series, currentPeriod }`.
- Return one series for sent, one for received, and the global series. The share and the timing ratio need the global series.
- For `All`, the first timestamp is the first transaction of the address, not the Dencun date.
- Fill the gaps with zeros, the same as `getTimeseries`.

### Cache

- Cache with a short TTL, keyed by address and input.

### `tx.getAll`

- Add an `address` filter that matches `from` OR `to`.
- Each returned transaction shows if it is sent, received or both.

## Metrics

### Derived metrics

The API or the web calculates these values from the columns of one role.

| Metric | Formula |
|---|---|
| Avg blobs per tx | `total_blobs ÷ total_transactions` |
| Avg fee per tx (ETH) | `total_blob_base_fee ÷ total_transactions` |
| Avg fee per tx (USD) | `total_blob_base_fee_usd ÷ total_usd_priced_transactions` |
| Blob utilization | `total_blob_usage_size ÷ (total_blobs × 131072)` |
| Cost per useful KB | `total_blob_base_fee ÷ (total_blob_usage_size ÷ 1024)`, and the same in USD |
| Unused blob space | `total_blobs × 131072 − total_blob_usage_size` |
| Cost of the unused space | `total_blob_base_fee × (1 − utilization)` |
| Calldata savings | `total_blob_as_calldata_fee − total_blob_base_fee`, and the same in USD |
| Avg txs per day | The mean of the daily txs of the time frame, sent and received together. Days with no txs count as 0. The current day is not complete, so it is not in the mean, except when it is the only day. For an hourly time frame: the mean of the hourly txs × 24. |
| Avg blobs per day | The same as avg txs per day, with the blobs |
| Active age | now − the first transaction of the address |
| Last active | now − the last transaction of the address |
| Active days | The number of daily rows with transactions in the role |

### Metrics with the global row

The global row is the row of `hourly_metrics` or `daily_metrics` with `category = NULL` and `rollup = NULL`, for the same period.

| Metric | Formula |
|---|---|
| Share of network blobs | `address total_blobs ÷ global totalBlobs` |
| Timing ratio (sent only) | `(address blob base fee ÷ address blob gas) ÷ (global totalBlobBaseFee ÷ global totalBlobGasUsed)` |

- Both sides of the timing ratio are weighted by gas. Do not use `avgBlobGasPrice`, because it is an average for each block.
- A ratio below 1 means that the address posts when blob gas costs less than the network average.

## Web

### Header

The header is always visible and shows all-time values. The values use the two roles together. For example, the first transaction is the first transaction where the address is `from` or `to`, and active days counts the days with a transaction in either role.

- the address and the rollup label (if the address has one)
- the first transaction (link and date) and the last transaction (link and date)
- active age, last active and active days

### Tabs

- Two tabs: **Transactions** (default) and **Analytics**. The tab is in the URL as `?tab=`.

### Transactions tab

- The list shows sent and received transactions together, with a "Sent" or "Received" mark on each transaction. It uses the new `address` filter of `tx.getAll`.
- The count in the title is `sent_total_transactions + received_total_transactions − self_total_transactions` from `address.getOverall` for `All`. Thus each transaction counts one time, also a self-send.
- This fixes the current bug: the page calls `tx.getAll` without `count: true`, so the count is empty.

### Analytics tab

**Control bar**

- Time frame. The default is `All`.
- ETH/USD toggle. It is hidden on testnets, the same as on the stat pages.
- There is no role toggle.

**Roles shown on the page**

- In the selected time frame, the received role shows only if `received_total_transactions > self_total_transactions`. Thus a self-sender shows as a sender only.
- The sent role shows if `sent_total_transactions > 0`.

**Metric cards (8)**

Each card shows the value of the main role, which is the shown role with more transactions. If the other role is shown, the card also shows its value on a small second line.

| # | Card | Small values on the card |
|---|---|---|
| 1 | Total txs | Cadence |
| 2 | Total blobs | Avg blobs per tx |
| 3 | Total blob fees (ETH/USD) | Calldata savings |
| 4 | Avg fee per tx | |
| 5 | Cost per useful KB | |
| 6 | Blob utilization | Unused space and its cost |
| 7 | Share of network blobs | |
| 8 | Timing ratio (sent). If the address has no sent transactions: calldata savings. | |

**Charts (6, in a grid with 2 columns)**

1. Txs
2. Blobs
3. Blob fees (ETH/USD)
4. Cost per useful KB (ETH/USD)
5. Blob size vs usage size
6. Timing ratio vs network, sent only, with a reference line at 1.0

- Each chart has a **Sent** series and a **Received** series, side by side. Do not stack them.
- A series shows only if its role shows (see "Roles shown on the page").
- Use the current `TimeseriesChartBase` and `transformToDatasets`.
- Always show the cards and the charts, also for an address with little activity.

## Tests

- Add an address mixin to `apps/dagster/tests/test_assets.py`. Calculate the expected rows in Python from `db-fixtures.json`, the same as the current mixins.
- Test cases:
  - all columns, for each role, at the hourly, daily and all-time levels
  - reorg: a forked transaction is not counted, and a re-run removes stale rows
  - no USD price for a minute
  - self-send: the transaction counts in both roles and in `self_total_transactions`
  - the hourly guard: a partition older than 30 days does nothing
  - the 30-day cleanup
  - all-time: closed days only, and `aggregated_until`
- Add to the fixtures:
  - an address that only receives
  - an address that both sends and receives
  - a self-send
  - a self-sender (an address that sends only to itself)
- Add web or API tests for the title count (`sent + received − self`) and for the rule that hides the received role of a self-sender.
- Add API tests for `address.getOverall` (`All` and other time frames, including the gap after `aggregated_until`) and for the `address` filter of `tx.getAll`.

## Out of scope

- Counterparty metrics: unique senders, top senders, "Posts to", poster history and concentration. These need a table for each sender–receiver pair.
- Fee headroom and the max fee columns.
- Blob gas used and blob size columns (calculated from `total_blobs`).
- Weekly, monthly and yearly address tables.
- Blob storage breakdown for each address.

## Data volume (production)

| Role | Addresses | Address-days |
|---|---|---|
| Sent | 6,312 | 60,305 |
| Received | 5,750 | 62,448 |

- `address_daily_metrics`: at most ~123k rows for the full history. An address that sends and receives on the same day has one row, so the real number is lower.
- `address_all_time_metrics`: at most ~12k rows.
- `address_hourly_metrics` (30 days): the number of rows is small, because most addresses are active on few days.
- The sent numbers come from an export of `from_id` and active days. The received numbers come from this query:

```sql
SELECT COUNT(DISTINCT to_id) AS receivers,
       COUNT(DISTINCT (DATE(block_timestamp), to_id)) AS receiver_days
FROM transaction;
```

## Delivery

- Start from `origin/main`.
- PR 1: the Prisma migration and the Dagster assets, schedules and tests.
- PR 2: the `address` router and the `tx.getAll` filter.
- PR 3: the web page.
- Changesets are `minor`.
