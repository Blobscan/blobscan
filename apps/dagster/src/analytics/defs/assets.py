import dagster as dg

# A runtime import: Dagster reads the annotations of the functions in this
# module, and the project also runs on Python 3.13.
from sqlalchemy.sql.elements import TextClause  # noqa: TC002

from analytics.defs.helpers import (
    AGGREGATE_ADDRESS_ALL_TIME_SQL,
    AGGREGATE_ALL_TIME_SQL,
    AGGREGATE_BLOB_HOURLY_SQL,
    AGGREGATE_ETH_PRICE_HOURLY_SQL,
    AGGREGATE_TX_HOURLY_SQL,
    address_hourly_retention_cutoff,
    build_address_rollup_sql,
    build_address_sql,
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

# Materialize every partition, the current (in-progress) one too, when its
# upstream partitions are updated. The live schedule refreshes the current
# hourly partition every 10 minutes, so the current partition of each rollup
# level follows in a cascade: hourly -> daily -> weekly/monthly -> yearly.
#
# eager() only targets the latest partition, so in_latest_time_window() is
# removed. .without() requires an exact match with an operand of eager().
rollup_condition = dg.AutomationCondition.eager().without(
    dg.AutomationCondition.in_latest_time_window(),
)


@dg.asset(
    partitions_def=hourly_partitions,
    backfill_policy=dg.BackfillPolicy.multi_run(24 * 7),
    pool="metrics/hourly_metrics",
)
def hourly_metrics(
    context: dg.AssetExecutionContext, postgres: PostgresResource,
) -> dg.MaterializeResult:
    (
        (tx_rowcount, tx_query_ms),
        (blob_rowcount, blob_query_ms),
        (eth_price_rowcount, eth_price_query_ms),
    ) = execute_sqls_window(
        context=context,
        postgres=postgres,
        sqls=[
            AGGREGATE_TX_HOURLY_SQL,
            AGGREGATE_BLOB_HOURLY_SQL,
            AGGREGATE_ETH_PRICE_HOURLY_SQL,
        ],
        table="hourly_metrics",
    )

    return dg.MaterializeResult(
        metadata={
            "partition_range": partition_meta(context),
            "rows_affected": dg.MetadataValue.int(tx_rowcount),
            "blob_rows_affected": dg.MetadataValue.int(blob_rowcount),
            "blob_query_ms": dg.MetadataValue.int(blob_query_ms),
            "tx_query_ms": dg.MetadataValue.int(tx_query_ms),
            "eth_price_rows_affected": dg.MetadataValue.int(eth_price_rowcount),
            "eth_price_query_ms": dg.MetadataValue.int(eth_price_query_ms),
            "query_ms": dg.MetadataValue.int(
                tx_query_ms + blob_query_ms + eth_price_query_ms,
            ),
        },
    )


_daily_sql = build_aggregate_sql("hourly_metrics", "daily_metrics", "day")
_weekly_sql = build_aggregate_sql("daily_metrics", "weekly_metrics", "week")
_monthly_sql = build_aggregate_sql("daily_metrics", "monthly_metrics", "month")
_yearly_sql = build_aggregate_sql("monthly_metrics", "yearly_metrics", "year")


@dg.asset(
    deps=[dg.AssetDep(hourly_metrics, partition_mapping=_ignore_missing)],
    partitions_def=daily_partitions,
    automation_condition=rollup_condition,
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
    automation_condition=rollup_condition,
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
    automation_condition=rollup_condition,
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
    automation_condition=rollup_condition,
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


# ---------------------------------------------------------------------------
# Address metrics (see docs/specs/address-metrics.md)
# ---------------------------------------------------------------------------

_address_hourly_sql = build_address_sql("address_hourly_metrics", "hour")
_address_daily_sql = build_address_sql("address_daily_metrics", "day")


@dg.asset(
    # The asset does not read hourly_metrics. The dependency makes it follow
    # the live and the catch-up schedules of hourly_metrics, with the same
    # automation condition as the rollup levels.
    deps=[hourly_metrics],
    partitions_def=hourly_partitions,
    automation_condition=rollup_condition,
    backfill_policy=dg.BackfillPolicy.multi_run(24 * 7),
    pool="metrics/address_hourly_metrics",
)
def address_hourly_metrics(
    context: dg.AssetExecutionContext, postgres: PostgresResource,
) -> dg.MaterializeResult:
    """Aggregate the metrics of each address per hour, for the last 30 days.

    A cleanup schedule deletes older rows. Thus a partition older than the
    retention does nothing, so that a backfill does not do work that the
    cleanup then deletes. A partition range is cut at the retention limit.
    """
    window = context.partition_time_window
    cutoff = address_hourly_retention_cutoff()

    if window.end <= cutoff:
        context.log.warning(
            "Skipped %s: address_hourly_metrics keeps only the hours after %s.",
            partition_meta(context),
            cutoff.isoformat(),
        )
        return dg.MaterializeResult(
            metadata={
                "partition_range": partition_meta(context),
                "skipped": dg.MetadataValue.bool(True),
            },
        )

    rowcount, ms = execute_sql_window(
        context=context,
        postgres=postgres,
        sql=_address_hourly_sql,
        table="address_hourly_metrics",
        window=(max(window.start, cutoff), window.end),
    )

    return dg.MaterializeResult(
        metadata={
            "partition_range": partition_meta(context),
            "skipped": dg.MetadataValue.bool(False),
            "rows_affected": dg.MetadataValue.int(rowcount),
            "query_ms": dg.MetadataValue.int(ms),
        },
    )


@dg.asset(
    # The asset reads the raw tables, not address_hourly_metrics, so it can
    # aggregate days older than the hourly retention. The dependency only
    # makes the current day follow each hourly update.
    deps=[dg.AssetDep(address_hourly_metrics, partition_mapping=_ignore_missing)],
    partitions_def=daily_partitions,
    automation_condition=rollup_condition,
    backfill_policy=dg.BackfillPolicy.multi_run(30),
    pool="metrics/address_daily_metrics",
)
def address_daily_metrics(
    context: dg.AssetExecutionContext, postgres: PostgresResource,
) -> dg.MaterializeResult:
    rowcount, ms = execute_sql_window(
        context=context,
        postgres=postgres,
        sql=_address_daily_sql,
        table="address_daily_metrics",
    )

    return dg.MaterializeResult(
        metadata={
            "partition_range": partition_meta(context),
            "rows_affected": dg.MetadataValue.int(rowcount),
            "query_ms": dg.MetadataValue.int(ms),
        },
    )


_address_weekly_sql = build_address_rollup_sql(
    "address_daily_metrics", "address_weekly_metrics", "week",
)
_address_monthly_sql = build_address_rollup_sql(
    "address_daily_metrics", "address_monthly_metrics", "month",
)
_address_yearly_sql = build_address_rollup_sql(
    "address_monthly_metrics", "address_yearly_metrics", "year",
)


def _materialize_address_rollup(
    context: dg.AssetExecutionContext,
    postgres: PostgresResource,
    sql: TextClause,
    table: str,
) -> dg.MaterializeResult:
    rowcount, ms = execute_sql_window(
        context=context, postgres=postgres, sql=sql, table=table,
    )

    return dg.MaterializeResult(
        metadata={
            "partition_range": partition_meta(context),
            "rows_affected": dg.MetadataValue.int(rowcount),
            "query_ms": dg.MetadataValue.int(ms),
        },
    )


# The weekly, monthly and yearly levels follow the network levels: each
# partition, the current one too, runs again when one of its upstream
# partitions is updated. Thus a re-run of an old day also updates its week,
# its month and its year.
@dg.asset(
    deps=[dg.AssetDep(address_daily_metrics, partition_mapping=_ignore_missing)],
    partitions_def=weekly_partitions,
    automation_condition=rollup_condition,
    backfill_policy=dg.BackfillPolicy.multi_run(30),
    pool="metrics/address_weekly_metrics",
)
def address_weekly_metrics(
    context: dg.AssetExecutionContext, postgres: PostgresResource,
) -> dg.MaterializeResult:
    return _materialize_address_rollup(
        context, postgres, _address_weekly_sql, "address_weekly_metrics",
    )


@dg.asset(
    deps=[dg.AssetDep(address_daily_metrics, partition_mapping=_ignore_missing)],
    partitions_def=monthly_partitions,
    automation_condition=rollup_condition,
    backfill_policy=dg.BackfillPolicy.multi_run(12),
    pool="metrics/address_monthly_metrics",
)
def address_monthly_metrics(
    context: dg.AssetExecutionContext, postgres: PostgresResource,
) -> dg.MaterializeResult:
    return _materialize_address_rollup(
        context, postgres, _address_monthly_sql, "address_monthly_metrics",
    )


@dg.asset(
    deps=[dg.AssetDep(address_monthly_metrics, partition_mapping=_ignore_missing)],
    partitions_def=yearly_partitions,
    automation_condition=rollup_condition,
    pool="metrics/address_yearly_metrics",
)
def address_yearly_metrics(
    context: dg.AssetExecutionContext, postgres: PostgresResource,
) -> dg.MaterializeResult:
    return _materialize_address_rollup(
        context, postgres, _address_yearly_sql, "address_yearly_metrics",
    )


# Run after an update of a closed period only: a day, a month or a year that
# is not the current one. For example, after a day closes (the catch-up
# schedule updates its last hours), after its month or its year closes, and
# after a re-run of an older period. The updates of the current periods do not
# change the all-time rows.
closed_period_updated_condition = (
    dg.AutomationCondition.any_deps_match(
        dg.AutomationCondition.newly_updated()
        & ~dg.AutomationCondition.in_latest_time_window(),
    ).since_last_handled()
    & ~dg.AutomationCondition.any_deps_in_progress()
    & ~dg.AutomationCondition.in_progress()
).with_label("closed_period_updated")


@dg.asset(
    # The SQL reads the closed years, the closed months of the current year
    # and the closed days of the current month (see
    # aggregate_address_all_time.sql).
    deps=[address_daily_metrics, address_monthly_metrics, address_yearly_metrics],
    automation_condition=closed_period_updated_condition,
    pool="metrics/address_all_time_metrics",
)
def address_all_time_metrics(postgres: PostgresResource) -> dg.MaterializeResult:
    rowcount, ms = execute_full_refresh(
        postgres=postgres,
        sql=AGGREGATE_ADDRESS_ALL_TIME_SQL,
        table="address_all_time_metrics",
    )

    return dg.MaterializeResult(
        metadata={
            "rows_affected": dg.MetadataValue.int(rowcount),
            "query_ms": dg.MetadataValue.int(ms),
        },
    )
