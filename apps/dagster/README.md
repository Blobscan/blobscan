# blobscan-dagster

## Getting started

### Installing dependencies

**Option 1: uv**

Ensure [`uv`](https://docs.astral.sh/uv/) is installed following their [official documentation](https://docs.astral.sh/uv/getting-started/installation/).

Create a virtual environment, and install the required dependencies using _sync_:

```bash
uv sync
```

Then, activate the virtual environment:

| OS | Command |
| --- | --- |
| MacOS | ```source .venv/bin/activate``` |
| Windows | ```.venv\Scripts\activate``` |

**Option 2: pip**

Install the python dependencies with [pip](https://pypi.org/project/pip/):

```bash
python3 -m venv .venv
```

Then activate the virtual environment:

| OS | Command |
| --- | --- |
| MacOS | ```source .venv/bin/activate``` |
| Windows | ```.venv\Scripts\activate``` |

Install the required dependencies:

```bash
pip install -e ".[dev]"
```

### Running Dagster

Start the Dagster UI web server:

```bash
dg dev
```

Open http://localhost:3000 in your browser to see the project.

## Metrics pipeline

The pipeline aggregates blob and transaction data into `hourly_metrics`, then
rolls it up into `daily_metrics`, `weekly_metrics`, `monthly_metrics`,
`yearly_metrics` and `all_time_metrics`.

- **`live_hourly_schedule`** refreshes the in-progress hour every 10 minutes.
  `hourly_catch_up_schedule` re-aggregates the last 3 hours at :05 to pick up
  late data and reorgs.
- **`metrics_late_data_sensor`** re-aggregates the older hours that the
  indexer changed after they were aggregated, for example after an outage of
  the indexer. See [Late data](docs/operations.md#late-data).
- **Rollup levels** (daily, weekly, monthly, yearly) are materialized by
  automation conditions when their upstream partitions are updated. This
  includes the in-progress period, so each live update of `hourly_metrics`
  cascades to daily, then weekly and monthly, then yearly, within about a
  minute.
- **`all_time_metrics_schedule`** fully refreshes `all_time_metrics` every 10
  minutes (at :05, :15, ...), after the cascade. It does not run from an
  automation condition, so a full refresh does not run once for each level.
  It is running by default.
- The other schedules are created stopped: enable them in the UI after
  deploying.
- Every run **replaces** the rows of its time window, so re-running a partition
  or backfilling a range after a SQL change is safe.
- The `*_usd` fee columns use the `eth_usd_price` row of the minute of each
  transaction's block, as the API does. A transaction with no price for its
  minute adds nothing, so the total is partial when minutes are missing, and
  `NULL` when no transaction in the group has a price.
  `total_usd_priced_transactions` counts the transactions that have a price.
  Divide a USD total by it, not by `total_transactions`. The price syncer must
  write one price each minute. Backfill `eth_usd_price` before you backfill
  the metrics.

### Address metrics

More assets store the metrics of each address (see
`docs/specs/address-metrics.md`). Each row has the `sent_*` values (the
address is `from`) and the `received_*` values (the address is `to`) of one
period.

- **`address_hourly_metrics`** follows each update of `hourly_metrics`, so the
  live and the catch-up schedules also update it. It keeps only the last 30
  days. A partition older than that does nothing and logs a warning, and
  `address_hourly_metrics_cleanup_schedule` deletes the older rows every day
  at 03:30 UTC. The cleanup schedule is running by default.
- **`address_daily_metrics`** follows `address_hourly_metrics`, but it reads
  the raw tables, not the hourly rows. Thus it can aggregate any day, also
  days older than 30 days.
- **`address_weekly_metrics`** and **`address_monthly_metrics`** come from the
  daily rows, and **`address_yearly_metrics`** comes from the monthly rows. They
  use the same automation condition as the network levels, so a re-run of an
  old day also updates its week, its month and its year.
- **`address_all_time_metrics`** is a full refresh from the closed periods: the
  closed years, the closed months of the current year and the closed days of
  the current month. It runs from an automation condition when a closed day,
  month or year is updated. `aggregated_until` is the last day that it
  includes. The API adds the daily rows after that day.

Asset checks compare the network metrics with the source tables, each rollup
level with the level it comes from, and the dimension rows of each hour with
their totals. A freshness check fails when the newest aggregated block is too
old. See [Checks](docs/operations.md#checks).

For backfills, reprocessing, checks, alerts and concurrency, see
[Operations](docs/operations.md). For the commands, see
[Command line](docs/commandline.md).

## Learn more

To learn more about this template and Dagster in general:

- [Dagster Documentation](https://docs.dagster.io/)
- [Dagster University](https://courses.dagster.io/)
- [Dagster Slack Community](https://dagster.io/slack)
