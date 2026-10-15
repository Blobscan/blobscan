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

- **Live schedules** (`live_*_schedule`) refresh the in-progress period of each
  table. `hourly_catch_up_schedule` re-aggregates the last 3 hours at :05 to
  pick up late data and reorgs. Schedules are created stopped: enable them in
  the UI after deploying.
- **Completed periods** are materialized by automation conditions once their
  upstream data is updated.
- Every run **replaces** the rows of its time window, so re-running a partition
  or backfilling a range after a SQL change is safe.

### Migration from `daily_stats` / `overall_stats`

The API still serves stats from the legacy `daily_stats` and `overall_stats`
tables, filled by the `DailyStatsSyncer` / `OverallStatsSyncer` in
`@blobscan/syncers`. Both pipelines run side by side until the new one is
validated:

1. **Validate**: the `matches_legacy_daily_stats` asset check on
   `daily_metrics` compares transaction, blob and block counts with
   `daily_stats` for the last 7 completed days, and warns with a sample of
   mismatching rows. Investigate any mismatch before moving on.
2. **Migrate reads**: switch `stats.getTimeseries` to `daily_metrics` (and the
   other period tables) and `stats.getOverall` to `all_time_metrics`.
3. **Remove the legacy pipeline**: drop the stats syncers, the
   `daily_stats` / `overall_stats` tables and this asset check.

### Alerts

- `metrics_run_failure_alert`: any failed run.
- `hourly_metrics_staleness_alert`: `hourly_metrics` not updated for 30
  minutes; alerts once when it goes stale and once when it recovers.

Both sensors are enabled by default and always log the alert. To also post
it to Slack (or any service accepting a Slack-compatible `{"text": ...}`
payload), set `DAGSTER_ALERT_WEBHOOK_URL` on the code location
(`dagster-blobscan`) container.

### Concurrency

`dagster.yaml` allows at most 5 concurrent runs, at most one run per metrics
table for the scheduled jobs (tag `blobscan/metrics_table`), and at most 3
backfill runs, so live refreshes keep running during a backfill.

## Learn more

To learn more about this template and Dagster in general:

- [Dagster Documentation](https://docs.dagster.io/)
- [Dagster University](https://courses.dagster.io/)
- [Dagster Slack Community](https://dagster.io/slack)
