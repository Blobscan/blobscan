from datetime import timedelta
from pathlib import Path
import time

from analytics.defs.asset_factories import make_metrics_asset
import dagster as dg
from sqlalchemy import text

from .resources.postgres import PostgresResource

SQL_DIR = Path(__file__).parent / "sql"
SQL_TEMPLATE = (SQL_DIR / "aggregate.sql").read_text()

def build_aggregate_sql(source: str, target: str, trunc: str):
    return text(
        SQL_TEMPLATE
        .replace("{{source_table}}", source)
        .replace("{{target_table}}", target)
        .replace("{{trunc}}", trunc)
    )

AGGREGATE_TX_HOURLY_SQL = text((SQL_DIR / "aggregate_tx_hourly.sql").read_text())
AGGREGATE_BLOB_HOURLY_SQL = text((SQL_DIR / "aggregate_blob_hourly.sql").read_text())
AGGREGATE_ALL_TIME_SQL = text((SQL_DIR / "aggregate_all_time.sql").read_text())


hourly_partitions = dg.HourlyPartitionsDefinition(start_date="2025-08-24-22:00", end_offset=1)
daily_partitions = dg.DailyPartitionsDefinition(start_date="2025-08-24", fmt="%Y-%m-%d", end_offset=1)
weekly_partitions = dg.WeeklyPartitionsDefinition(start_date="2025-08-24", fmt="%Y-%m-%d", end_offset=1)
monthly_partitions = dg.MonthlyPartitionsDefinition(start_date="2025-08", fmt="%Y-%m", end_offset=1)
yearly_partitions = dg.TimeWindowPartitionsDefinition(
    start="2025",
    cron_schedule="0 0 1 1 *",  # every Jan 1st
    fmt="%Y",
    end_offset=1
)

# .without() requires an exact match with an existing operand in eager().
# eager() contains in_latest_time_window() (no args), so we:
#   1. remove it via .without()
#   2. re-add a negated version with the correct lookback_delta
# With end_offset=1, "latest time window" shifts one period forward — lookback_delta
# must span two periods to reach back through the shift and cover the current period.
_eager_no_time_window = dg.AutomationCondition.eager().without(
    dg.AutomationCondition.in_latest_time_window()
)

daily_completed_only = _eager_no_time_window & ~dg.AutomationCondition.in_latest_time_window(
    lookback_delta=timedelta(days=1)
)
weekly_completed_only = _eager_no_time_window & ~dg.AutomationCondition.in_latest_time_window(
    lookback_delta=timedelta(weeks=1)
)
monthly_completed_only = _eager_no_time_window & ~dg.AutomationCondition.in_latest_time_window(
    lookback_delta=timedelta(days=32)
)
yearly_completed_only = dg.AutomationCondition.eager().without(
    dg.AutomationCondition.in_latest_time_window()
)


@dg.asset(
    partitions_def=hourly_partitions,
    backfill_policy=dg.BackfillPolicy.multi_run(24 * 7)
)
def hourly_metrics(context: dg.AssetExecutionContext, postgres: PostgresResource) -> dg.MaterializeResult:
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
        f"{pk_range.start}..{pk_range.end}" if pk_range else getattr(context, "partition_key", None)
    )

    return dg.MaterializeResult(
        metadata={
            "partition_range": partition_meta,
            "rows_affected": dg.MetadataValue.int(int(tx_query_result.rowcount)),
            "blob_rows_affected": dg.MetadataValue.int(int(blob_query_result.rowcount)),
            "blob_query_ms": dg.MetadataValue.int(int(blob_query_ms)),
            "tx_query_ms": dg.MetadataValue.int(int(tx_query_ms)),
            "query_ms": dg.MetadataValue.int(int(total_queries_ms))

        }
    )

_ignore_missing = dg.TimeWindowPartitionMapping(allow_nonexistent_upstream_partitions=True)

daily_metrics = make_metrics_asset(
    name="daily_metrics",
    deps=[dg.AssetDep(hourly_metrics, partition_mapping=_ignore_missing)],
    partitions_def=daily_partitions,
    sql=build_aggregate_sql(
      "hourly_metrics", "daily_metrics", "day"
    ),
    automation_condition=daily_completed_only,
    backfill_policy=dg.BackfillPolicy.multi_run(30),
)

weekly_metrics = make_metrics_asset(
    name="weekly_metrics",
    deps=[dg.AssetDep(daily_metrics, partition_mapping=_ignore_missing)],
    partitions_def=weekly_partitions,
    sql=build_aggregate_sql(
      "daily_metrics", "weekly_metrics", "week"
    ),
    automation_condition=weekly_completed_only,
    backfill_policy=dg.BackfillPolicy.multi_run(30),
)

monthly_metrics = make_metrics_asset(
    name="monthly_metrics",
    deps=[dg.AssetDep(daily_metrics, partition_mapping=_ignore_missing)],
    partitions_def=monthly_partitions,
    sql=build_aggregate_sql(
      "daily_metrics", "monthly_metrics", "month"
    ),
    automation_condition=monthly_completed_only,
    backfill_policy=dg.BackfillPolicy.multi_run(12),
)

yearly_metrics = make_metrics_asset(
    name="yearly_metrics",
    deps=[dg.AssetDep(monthly_metrics, partition_mapping=_ignore_missing)],
    partitions_def=yearly_partitions,
    sql=build_aggregate_sql(
      "monthly_metrics", "yearly_metrics", "year"
    ),
    automation_condition=yearly_completed_only,
)



all_time_condition = (
    # trigger when something upstream was newly materialized
    dg.AutomationCondition.any_deps_match(dg.AutomationCondition.newly_updated()) &
    # but only if ALL partitions of ALL deps are already materialized
    dg.AutomationCondition.all_deps_match(~dg.AutomationCondition.missing()) &
    ~dg.AutomationCondition.in_progress()
)



@dg.asset(
    deps=[hourly_metrics, daily_metrics, weekly_metrics, monthly_metrics, yearly_metrics],
    automation_condition=all_time_condition
)
def all_time_metrics(postgres: PostgresResource):
    with postgres.get_connection() as conn:
        res = conn.execute(AGGREGATE_ALL_TIME_SQL)
        conn.commit()
    
    return dg.MaterializeResult(
            metadata={
                "rows_affected": dg.MetadataValue.int(res.rowcount),
            }
        )


