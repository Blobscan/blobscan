import dagster as dg
from sqlalchemy import text

from analytics.defs.assets import (
    address_all_time_metrics,
    address_daily_metrics,
    address_hourly_metrics,
    address_monthly_metrics,
    address_weekly_metrics,
    address_yearly_metrics,
    all_time_metrics,
    daily_metrics,
    hourly_metrics,
    monthly_metrics,
    weekly_metrics,
    yearly_metrics,
)
from analytics.defs.helpers import address_hourly_retention_cutoff
from analytics.defs.resources.postgres import PostgresResource

# The limit of one run per metrics table is set with a pool on each asset (see
# assets.py and dagster.yaml), so it also applies to automation and backfill
# runs, not only to these jobs.

all_time_metrics_job = dg.define_asset_job(
    name="all_time_metrics_job",
    selection=[all_time_metrics],
)

hourly_metrics_job = dg.define_asset_job(
    name="hourly_metrics_job",
    selection=[hourly_metrics],
)

daily_metrics_job = dg.define_asset_job(
    name="daily_metrics_job",
    selection=[daily_metrics],
)

weekly_metrics_job = dg.define_asset_job(
    name="weekly_metrics_job",
    selection=[weekly_metrics],
)

monthly_metrics_job = dg.define_asset_job(
    name="monthly_metrics_job",
    selection=[monthly_metrics],
)

yearly_metrics_job = dg.define_asset_job(
    name="yearly_metrics_job",
    selection=[yearly_metrics],
)

address_hourly_metrics_job = dg.define_asset_job(
    name="address_hourly_metrics_job",
    selection=[address_hourly_metrics],
)

address_daily_metrics_job = dg.define_asset_job(
    name="address_daily_metrics_job",
    selection=[address_daily_metrics],
)

address_weekly_metrics_job = dg.define_asset_job(
    name="address_weekly_metrics_job",
    selection=[address_weekly_metrics],
)

address_monthly_metrics_job = dg.define_asset_job(
    name="address_monthly_metrics_job",
    selection=[address_monthly_metrics],
)

address_yearly_metrics_job = dg.define_asset_job(
    name="address_yearly_metrics_job",
    selection=[address_yearly_metrics],
)

address_all_time_metrics_job = dg.define_asset_job(
    name="address_all_time_metrics_job",
    selection=[address_all_time_metrics],
)


@dg.op(pool="metrics/address_hourly_metrics")
def delete_old_address_hourly_metrics(
    context: dg.OpExecutionContext, postgres: PostgresResource,
) -> None:
    """Delete the address_hourly_metrics rows older than the retention.

    It uses the pool of address_hourly_metrics, so it does not run at the same
    time as a run of that asset.
    """
    cutoff = address_hourly_retention_cutoff()
    with postgres.transaction() as conn:
        res = conn.execute(
            text("DELETE FROM address_hourly_metrics WHERE period_start < :cutoff"),
            {"cutoff": cutoff},
        )
    context.log.info(
        "Deleted %d address_hourly_metrics rows before %s.",
        res.rowcount,
        cutoff.isoformat(),
    )


@dg.job
def address_hourly_metrics_cleanup_job() -> None:
    delete_old_address_hourly_metrics()
