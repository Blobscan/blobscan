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

For backfills, reprocessing, alerts and concurrency, see
[Operations](docs/operations.md). For the commands, see
[Command line](docs/commandline.md).

## Learn more

To learn more about this template and Dagster in general:

- [Dagster Documentation](https://docs.dagster.io/)
- [Dagster University](https://courses.dagster.io/)
- [Dagster Slack Community](https://dagster.io/slack)
