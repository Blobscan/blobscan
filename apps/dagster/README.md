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

### Initial backfill

Partitions start at `DAGSTER_METRICS_START_DATE` or, if unset, at the Dencun
activation date of `CHAIN_ID` (mainnet: 2024-03-13 13:55 UTC). On a fresh
deployment, every partition from that date to now has to be backfilled once.

1. Check that the code location loads and `DATABASE_URL` points at the right
   database (**Deployment** → code location `dagster`).
2. Measure the cost of a run first: materialize a single recent
   `hourly_metrics` partition and look at its `query_ms` metadata.
3. Launch the backfill from the UI: **Assets** → select `hourly_metrics`,
   `daily_metrics`, `weekly_metrics`, `monthly_metrics`, `yearly_metrics` and
   `all_time_metrics` → **Materialize selected** → **All partitions** →
   **Launch backfill**. Dagster runs each level after its upstream partitions
   are done, so a single backfill covers the whole chain.
4. Enable the schedules once the backfill has caught up to the current
   period. Starting them earlier also works: runs replace their window, so
   overlapping live and backfill runs don't corrupt data.

Each backfill run covers several partitions in a single query (the
`backfill_policy` of each asset), and at most 3 backfill runs execute at once
(`dagster.yaml`). For mainnet from Dencun to late 2026 (~950 days) that means
roughly:

| Asset | Partitions | Partitions per run | Runs |
| --- | --- | --- | --- |
| `hourly_metrics` | ~22,800 | 168 (1 week) | ~136 |
| `daily_metrics` | ~950 | 30 | ~32 |
| `weekly_metrics` | ~136 | 30 | ~5 |
| `monthly_metrics` | ~32 | 12 | ~3 |
| `yearly_metrics` | 3 | 1 | 3 |

`hourly_metrics` dominates: estimate the total as about
`136 × (query_ms of a 1-week run) / 3`. The rollup levels read the
already-aggregated tables and are cheap in comparison.

Avoid `dg launch --partition-range` for large ranges: it executes the whole
range in-process as a single run and a single query, without the backfill
policy or the concurrency limits.

### Reprocessing after a SQL change

Runs replace the rows of their window, so reprocessing is a backfill of the
affected range: select the changed asset and everything downstream of it, pick
the partition range, and launch the backfill. For example, a fix to
`aggregate_tx_hourly.sql` means backfilling `hourly_metrics` and all rollup
levels for the affected dates.

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
