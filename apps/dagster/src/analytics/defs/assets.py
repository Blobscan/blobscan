import time
from datetime import timedelta

import dagster as dg

from analytics.defs.helpers import (
    AGGREGATE_ALL_TIME_SQL,
    AGGREGATE_BLOB_HOURLY_SQL,
    AGGREGATE_TX_HOURLY_SQL,
    build_aggregate_sql,
    execute_sql_window,
    get_partition_start_date,
    partition_meta,
)
from analytics.defs.resources.postgres import PostgresResource

_start = get_partition_start_date()
_midnight = _start.replace(hour=0, minute=0, second=0, microsecond=0)

_start_dates = {
    "hourly": _start.replace(minute=0, second=0, microsecond=0),
    "daily": _midnight,
    "weekly": _midnight - timedelta(days=(_midnight.weekday() + 1) % 7),
    "monthly": _midnight.replace(day=1),
    "yearly": _midnight.replace(month=1, day=1),
}

hourly_partitions = dg.HourlyPartitionsDefinition(
    start_date=_start_dates["hourly"], end_offset=1,
)
daily_partitions = dg.DailyPartitionsDefinition(
    start_date=_start_dates["daily"], fmt="%Y-%m-%d", end_offset=1,
)
weekly_partitions = dg.WeeklyPartitionsDefinition(
    start_date=_start_dates["weekly"], fmt="%Y-%m-%d", end_offset=1,
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
yearly_completed_only = dg.AutomationCondition.eager().without(
    dg.AutomationCondition.in_latest_time_window(),
)

all_time_condition = (
    # trigger when something upstream was newly materialized
    dg.AutomationCondition.any_deps_match(dg.AutomationCondition.newly_updated())
    &
    # but only if ALL partitions of ALL deps are already materialized
    dg.AutomationCondition.all_deps_match(~dg.AutomationCondition.missing())
    & ~dg.AutomationCondition.in_progress()
)


@dg.asset(
    partitions_def=hourly_partitions,
    backfill_policy=dg.BackfillPolicy.multi_run(24 * 7),
)
def hourly_metrics(
    context: dg.AssetExecutionContext, postgres: PostgresResource,
) -> dg.MaterializeResult:
    partition_start = context.partition_time_window.start
    partition_end = context.partition_time_window.end

    with postgres.get_connection() as conn:
        params = {"from": partition_start, "to": partition_end}

        tx_query_start = time.perf_counter()
        tx_query_result = conn.execute(AGGREGATE_TX_HOURLY_SQL, params)
        tx_query_end = time.perf_counter()

        blob_query_start = time.perf_counter()
        blob_query_result = conn.execute(AGGREGATE_BLOB_HOURLY_SQL, params)
        blob_query_end = time.perf_counter()

        conn.commit()

    blob_query_ms = (blob_query_end - blob_query_start) * 1000
    tx_query_ms = (tx_query_end - tx_query_start) * 1000
    total_queries_ms = (blob_query_end - tx_query_start) * 1000
    pk_range = getattr(context, "partition_key_range", None)
    partition_meta = (
        f"{pk_range.start}..{pk_range.end}"
        if pk_range
        else getattr(context, "partition_key", None)
    )

    return dg.MaterializeResult(
        metadata={
            "partition_range": partition_meta,
            "rows_affected": dg.MetadataValue.int(int(tx_query_result.rowcount)),
            "blob_rows_affected": dg.MetadataValue.int(int(blob_query_result.rowcount)),
            "blob_query_ms": dg.MetadataValue.int(int(blob_query_ms)),
            "tx_query_ms": dg.MetadataValue.int(int(tx_query_ms)),
            "query_ms": dg.MetadataValue.int(int(total_queries_ms)),
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
)
def daily_metrics(
    context: dg.AssetExecutionContext, postgres: PostgresResource,
) -> dg.MaterializeResult:
    rowcount, ms = execute_sql_window(
        context=context,
        postgres=postgres,
        sql=_daily_sql,
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
)
def weekly_metrics(
    context: dg.AssetExecutionContext, postgres: PostgresResource,
) -> dg.MaterializeResult:
    rowcount, ms = execute_sql_window(
        context=context,
        postgres=postgres,
        sql=_weekly_sql,
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
)
def monthly_metrics(
    context: dg.AssetExecutionContext, postgres: PostgresResource,
) -> dg.MaterializeResult:
    rowcount, ms = execute_sql_window(
        context=context,
        postgres=postgres,
        sql=_monthly_sql,
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
)
def yearly_metrics(
    context: dg.AssetExecutionContext, postgres: PostgresResource,
) -> dg.MaterializeResult:
    rowcount, ms = execute_sql_window(
        context=context,
        postgres=postgres,
        sql=_yearly_sql,
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
)
def all_time_metrics(postgres: PostgresResource):
    with postgres.get_connection() as conn:
        res = conn.execute(AGGREGATE_ALL_TIME_SQL)
        conn.commit()

    return dg.MaterializeResult(
        metadata={
            "rows_affected": dg.MetadataValue.int(res.rowcount),
        },
    )
