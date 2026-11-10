# Operations

How to backfill, reprocess and monitor the metrics pipeline. See the
[README](../README.md#metrics-pipeline) for an overview of the pipeline.

## Initial backfill

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

### Address metrics

Backfill the address metrics in this order. Each step can start when the step
before it is done:

1. `address_daily_metrics` for **all partitions**, and
   `address_hourly_metrics` for the **last 30 days** only. These two backfills
   do not depend on each other.
2. `address_weekly_metrics` and `address_monthly_metrics` for all partitions.
3. `address_yearly_metrics` for all partitions.
4. `address_all_time_metrics` one time. It also runs from its automation
   condition.

Avoid `dg launch --partition-range` for large ranges: it executes the whole
range in-process as a single run and a single query, without the backfill
policy or the concurrency limits.

## Reprocessing after a SQL change

Runs replace the rows of their window, so reprocessing is a backfill of the
affected range: select the changed asset and everything downstream of it, pick
the partition range, and launch the backfill. For example, a fix to
`aggregate_tx_hourly.sql` means backfilling `hourly_metrics` and all rollup
levels for the affected dates.

## Reprocessing after a rollup change

The hourly SQL reads `address.rollup` when it runs, and the metrics tables
store the rollup of each row. When the rollup of an existing address changes,
the metrics that were already aggregated keep the old attribution (usually
`other`) until they are aggregated again. This happens after a migration that
labels a new batcher, and also when the indexer runs with a new rollup
registry: its address upsert overwrites `address.rollup` with the rollup of the
registry.

Nothing detects these changes. After one of them, run the
`analytics.backfill_rollup_change` command to re-aggregate the affected
partitions. See [Command line](commandline.md#analyticsbackfill_rollup_change).

## Alerts

- `metrics_run_failure_alert`: any failed run.
- `hourly_metrics_staleness_alert`: `hourly_metrics` not updated for 30
  minutes; alerts once when it goes stale and once when it recovers.

`metrics_run_failure_alert` is enabled by default.
`hourly_metrics_staleness_alert` is stopped by default, the same as the live
schedules: enable it after you enable them. Only updates of the current or the
previous hour partition count, so a backfill does not hide a stopped live
schedule. Both sensors always log the alert. To also post
it to Slack (or any service accepting a Slack-compatible `{"text": ...}`
payload), set `DAGSTER_ALERT_WEBHOOK_URL` on the code location
(`dagster-blobscan`) container.

## Concurrency

`dagster.yaml` allows at most 5 concurrent runs and at most 3 backfill runs,
so live refreshes keep running during a backfill. Each metrics asset has its
own concurrency pool (`metrics/<table>`). Set each pool's limit to 1, so at
most one run writes a metrics table at a time, for scheduled, automation and
backfill runs:

```bash
for t in hourly daily weekly monthly yearly all_time \
  address_hourly address_daily address_weekly address_monthly address_yearly \
  address_all_time; do
  dagster instance concurrency set "metrics/${t}_metrics" 1
done
```

Limits can also be set from the Dagster UI (Deployment > Concurrency). Do not
use `concurrency.pools.default_limit` in `dagster.yaml`: with Postgres storage,
initializing a pool whose row already exists fails with
`InFailedSqlTransaction`. Pools without a limit are unlimited.
