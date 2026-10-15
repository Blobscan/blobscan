from datetime import timedelta

import dagster as dg

from analytics.defs.helpers import (
    AGGREGATE_ALL_TIME_SQL,
    AGGREGATE_BLOB_HOURLY_SQL,
    AGGREGATE_TX_HOURLY_SQL,
    build_aggregate_sql,
    execute_full_refresh,
    execute_sql_window,
    execute_sqls_window,
    get_partition_start_date,
    partition_meta,
    start_of_week,
)
from analytics.defs.resources.postgres import PostgresResource

_start = get_partition_start_date()
_midnight = _start.replace(hour=0, minute=0, second=0, microsecond=0)

_start_dates = {
    "hourly": _start.replace(minute=0, second=0, microsecond=0),
    "daily": _midnight,
    "weekly": start_of_week(_start),
    "monthly": _midnight.replace(day=1),
    "yearly": _midnight.replace(month=1, day=1),
}

hourly_partitions = dg.HourlyPartitionsDefinition(
    start_date=_start_dates["hourly"], fmt="%Y-%m-%dT%H:%M", end_offset=1,
)
daily_partitions = dg.DailyPartitionsDefinition(
    start_date=_start_dates["daily"], fmt="%Y-%m-%d", end_offset=1,
)
weekly_partitions = dg.WeeklyPartitionsDefinition(
    start_date=_start_dates["weekly"],
    fmt="%Y-%m-%d",
    day_offset=1,  # Monday-based weeks, matching start_of_week / DATE_TRUNC('week')
    end_offset=1,
)
monthly_partitions = dg.MonthlyPartitionsDefinition(
    start_date=_start_dates["monthly"], fmt="%Y-%m", end_offset=1,
)
yearly_partitions = dg.TimeWindowPartitionsDefinition(
    start=_start_dates["yearly"],
    cron_schedule="0 0 1 1 *",  # every Jan 1st
    fmt="%Y",
    end_offset=1,
)

_ignore_missing = dg.TimeWindowPartitionMapping(
    allow_nonexistent_upstream_partitions=True,
)

# .without() requires an exact match with an existing operand in eager().
# eager() contains in_latest_time_window() (no args), so we:
#   1. remove it via .without()
#   2. re-add a negated version with the correct lookback_delta
# With end_offset=1, "latest time window" shifts one period forward — lookback_delta
# must span two periods to reach back through the shift and cover the current period.
_eager_no_time_window = dg.AutomationCondition.eager().without(
    dg.AutomationCondition.in_latest_time_window(),
)

daily_completed_only = (
    _eager_no_time_window
    & ~dg.AutomationCondition.in_latest_time_window(lookback_delta=timedelta(days=1))
)
weekly_completed_only = (
    _eager_no_time_window
    & ~dg.AutomationCondition.in_latest_time_window(lookback_delta=timedelta(weeks=1))
)
monthly_completed_only = (
    _eager_no_time_window
    & ~dg.AutomationCondition.in_latest_time_window(lookback_delta=timedelta(days=32))
)
yearly_completed_only = (
    _eager_no_time_window
    & ~dg.AutomationCondition.in_latest_time_window(lookback_delta=timedelta(days=366))
)

# Recompute whenever something upstream was newly materialized. The all-time
# SQL reads the stored metric tables directly, so it doesn't wait for every
# upstream partition to exist: a single missing (or not-yet-run current)
# partition would otherwise block all-time metrics indefinitely. Right after a
# period rolls over, totals may briefly lag until the next level is
# materialized, and catch up on the following run.
all_time_condition = (
    dg.AutomationCondition.any_deps_match(dg.AutomationCondition.newly_updated())
    & ~dg.AutomationCondition.in_progress()
)


@dg.asset(
    partitions_def=hourly_partitions,
    backfill_policy=dg.BackfillPolicy.multi_run(24 * 7),
    pool="metrics/hourly_metrics",
)
def hourly_metrics(
    context: dg.AssetExecutionContext, postgres: PostgresResource,
) -> dg.MaterializeResult:
    (tx_rowcount, tx_query_ms), (blob_rowcount, blob_query_ms) = execute_sqls_window(
        context=context,
        postgres=postgres,
        sqls=[AGGREGATE_TX_HOURLY_SQL, AGGREGATE_BLOB_HOURLY_SQL],
        table="hourly_metrics",
    )

    return dg.MaterializeResult(
        metadata={
            "partition_range": partition_meta(context),
            "rows_affected": dg.MetadataValue.int(tx_rowcount),
            "blob_rows_affected": dg.MetadataValue.int(blob_rowcount),
            "blob_query_ms": dg.MetadataValue.int(blob_query_ms),
            "tx_query_ms": dg.MetadataValue.int(tx_query_ms),
            "query_ms": dg.MetadataValue.int(tx_query_ms + blob_query_ms),
        },
    )


_daily_sql = build_aggregate_sql("hourly_metrics", "daily_metrics", "day")
_weekly_sql = build_aggregate_sql("daily_metrics", "weekly_metrics", "week")
_monthly_sql = build_aggregate_sql("daily_metrics", "monthly_metrics", "month")
_yearly_sql = build_aggregate_sql("monthly_metrics", "yearly_metrics", "year")


@dg.asset(
    deps=[dg.AssetDep(hourly_metrics, partition_mapping=_ignore_missing)],
    partitions_def=daily_partitions,
    automation_condition=daily_completed_only,
    backfill_policy=dg.BackfillPolicy.multi_run(30),
    pool="metrics/daily_metrics",
)
def daily_metrics(
    context: dg.AssetExecutionContext, postgres: PostgresResource,
) -> dg.MaterializeResult:
    rowcount, ms = execute_sql_window(
        context=context,
        postgres=postgres,
        sql=_daily_sql,
        table="daily_metrics",
    )

    return dg.MaterializeResult(
        metadata={
            "partition_range": partition_meta(context),
            "rows_affected": dg.MetadataValue.int(rowcount),
            "query_ms": dg.MetadataValue.int(ms),
        },
    )


@dg.asset(
    deps=[dg.AssetDep(daily_metrics, partition_mapping=_ignore_missing)],
    partitions_def=weekly_partitions,
    automation_condition=weekly_completed_only,
    backfill_policy=dg.BackfillPolicy.multi_run(30),
    pool="metrics/weekly_metrics",
)
def weekly_metrics(
    context: dg.AssetExecutionContext, postgres: PostgresResource,
) -> dg.MaterializeResult:
    rowcount, ms = execute_sql_window(
        context=context,
        postgres=postgres,
        sql=_weekly_sql,
        table="weekly_metrics",
    )
    return dg.MaterializeResult(
        metadata={
            "partition_range": partition_meta(context),
            "rows_affected": dg.MetadataValue.int(rowcount),
            "query_ms": dg.MetadataValue.int(ms),
        },
    )


@dg.asset(
    deps=[dg.AssetDep(daily_metrics, partition_mapping=_ignore_missing)],
    partitions_def=monthly_partitions,
    automation_condition=monthly_completed_only,
    backfill_policy=dg.BackfillPolicy.multi_run(12),
    pool="metrics/monthly_metrics",
)
def monthly_metrics(
    context: dg.AssetExecutionContext, postgres: PostgresResource,
) -> dg.MaterializeResult:
    rowcount, ms = execute_sql_window(
        context=context,
        postgres=postgres,
        sql=_monthly_sql,
        table="monthly_metrics",
    )
    return dg.MaterializeResult(
        metadata={
            "partition_range": partition_meta(context),
            "rows_affected": dg.MetadataValue.int(rowcount),
            "query_ms": dg.MetadataValue.int(ms),
        },
    )


@dg.asset(
    deps=[dg.AssetDep(monthly_metrics, partition_mapping=_ignore_missing)],
    partitions_def=yearly_partitions,
    automation_condition=yearly_completed_only,
    pool="metrics/yearly_metrics",
)
def yearly_metrics(
    context: dg.AssetExecutionContext, postgres: PostgresResource,
) -> dg.MaterializeResult:
    rowcount, ms = execute_sql_window(
        context=context,
        postgres=postgres,
        sql=_yearly_sql,
        table="yearly_metrics",
    )
    return dg.MaterializeResult(
        metadata={
            "partition_range": partition_meta(context),
            "rows_affected": dg.MetadataValue.int(rowcount),
            "query_ms": dg.MetadataValue.int(ms),
        },
    )


@dg.asset(
    deps=[
        hourly_metrics,
        daily_metrics,
        weekly_metrics,
        monthly_metrics,
        yearly_metrics,
    ],
    automation_condition=all_time_condition,
    pool="metrics/all_time_metrics",
)
def all_time_metrics(postgres: PostgresResource) -> dg.MaterializeResult:
    rowcount, ms = execute_full_refresh(
        postgres=postgres,
        sql=AGGREGATE_ALL_TIME_SQL,
        table="all_time_metrics",
    )

    return dg.MaterializeResult(
        metadata={
            "rows_affected": dg.MetadataValue.int(rowcount),
            "query_ms": dg.MetadataValue.int(ms),
        },
    )
