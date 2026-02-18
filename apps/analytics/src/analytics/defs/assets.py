from datetime import datetime, timedelta
from pathlib import Path
import time

import dagster as dg
from sqlalchemy import text

from .resources.postgres import PostgresResource
from .sources import transaction, block, address, blob, blobs_on_transactions, transaction_fork

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
AGGREGATE_DAILY_SQL = build_aggregate_sql(
    "hourly_metrics", "daily_metrics", "day"
)

AGGREGATE_WEEKLY_SQL = build_aggregate_sql(
    "daily_metrics", "weekly_metrics", "week"
)

AGGREGATE_MONTHLY_SQL = build_aggregate_sql(
    "daily_metrics", "monthly_metrics", "month"
)

AGGREGATE_YEARLY_SQL = build_aggregate_sql(
    "monthly_metrics", "yearly_metrics", "year"
)


hourly_partitions = dg.HourlyPartitionsDefinition(start_date="2024-03-13-00:00")
daily_partitions = dg.DailyPartitionsDefinition(start_date="2024-03-13", fmt="%Y-%m-%d")
weekly_partitions = dg.WeeklyPartitionsDefinition(start_date="2024-03-13", fmt="%Y-%m-%d")
monthly_partitions = dg.MonthlyPartitionsDefinition(start_date="2024-03-13", fmt="%Y-%m-%d")
yearly_partitions = dg.TimeWindowPartitionsDefinition(
    start="2024",
    cron_schedule="0 0 1 1 *",  # every Jan 1st
    fmt="%Y",
)

@dg.asset(
    deps=[transaction, block, address, blob, blobs_on_transactions, transaction_fork],
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

@dg.asset(
    deps=[hourly_metrics],
    partitions_def=daily_partitions,
    backfill_policy=dg.BackfillPolicy.multi_run(30)
)
def daily_metrics(context: dg.AssetExecutionContext, postgres: PostgresResource) -> dg.MaterializeResult:
    partition_start = context.partition_time_window.start
    partition_end = context.partition_time_window.end


    with postgres.get_connection() as conn:
        params = {"from": partition_start, "to": partition_end}

        query_start = time.perf_counter()
        result = conn.execute(AGGREGATE_DAILY_SQL, params)
        query_end = time.perf_counter()

        conn.commit()

    query_ms = (query_end - query_start) * 1000
    pk_range = getattr(context, "partition_key_range", None)
    partition_meta = (
        f"{pk_range.start}..{pk_range.end}" if pk_range else getattr(context, "partition_key", None)
    )

    return dg.MaterializeResult(
        metadata={
            "partition_range": partition_meta,
            "rows_affected": dg.MetadataValue.int(result.rowcount),
            "query_ms": dg.MetadataValue.int(int(query_ms)),
        }
    )

@dg.asset(
    deps=[daily_metrics],
    partitions_def=weekly_partitions,
    backfill_policy=dg.BackfillPolicy.multi_run(30)
)
def weekly_metrics(context: dg.AssetExecutionContext, postgres: PostgresResource) -> dg.MaterializeResult:
    partition_start = context.partition_time_window.start
    partition_end = context.partition_time_window.end

    with postgres.get_connection() as conn:
        params = {"from": partition_start, "to": partition_end}

        query_start = time.perf_counter()
        result = conn.execute(AGGREGATE_WEEKLY_SQL, params)
        query_end = time.perf_counter()

        conn.commit()

    query_ms = (query_end - query_start) * 1000
    pk_range = getattr(context, "partition_key_range", None)
    partition_meta = (
        f"{pk_range.start}..{pk_range.end}" if pk_range else getattr(context, "partition_key", None)
    )

    return dg.MaterializeResult(
        metadata={
            "partition_range": partition_meta,
            "rows_affected": dg.MetadataValue.int(result.rowcount),
            "query_ms": dg.MetadataValue.int(int(query_ms)),
        }
    )

@dg.asset(
    deps=[daily_metrics],
    partitions_def=monthly_partitions,
    backfill_policy=dg.BackfillPolicy.multi_run(12)
)
def monthly_metrics(context: dg.AssetExecutionContext, postgres: PostgresResource) -> dg.MaterializeResult:
    partition_start = context.partition_time_window.start
    partition_end = context.partition_time_window.end

    with postgres.get_connection() as conn:
        params = {"from": partition_start, "to": partition_end}

        query_start = time.perf_counter()
        result = conn.execute(AGGREGATE_MONTHLY_SQL, params)
        query_end = time.perf_counter()

        conn.commit()

    query_ms = (query_end - query_start) * 1000
    pk_range = getattr(context, "partition_key_range", None)
    partition_meta = (
        f"{pk_range.start}..{pk_range.end}" if pk_range else getattr(context, "partition_key", None)
    )

    return dg.MaterializeResult(
        metadata={
            "partition_range": partition_meta,
            "rows_affected": dg.MetadataValue.int(result.rowcount),
            "query_ms": dg.MetadataValue.int(int(query_ms)),
        }
    )

@dg.asset(
    deps=[monthly_metrics],
    partitions_def=monthly_partitions,
)
def yearly_metrics(context: dg.AssetExecutionContext, postgres: PostgresResource) -> dg.MaterializeResult:
    partition_start = context.partition_time_window.start
    partition_end = context.partition_time_window.end

    with postgres.get_connection() as conn:
        params = {"from": partition_start, "to": partition_end}

        query_start = time.perf_counter()
        result = conn.execute(AGGREGATE_YEARLY_SQL, params)
        query_end = time.perf_counter()

        conn.commit()

    query_ms = (query_end - query_start) * 1000

    return dg.MaterializeResult(
        metadata={
            "partition": context.partition_key,
            "rows_affected": dg.MetadataValue.int(result.rowcount),
            "query_ms": dg.MetadataValue.int(int(query_ms)),
        }
    )



hourly_metrics_job = dg.define_asset_job(
    name="hourly_metrics_job",
    selection=[hourly_metrics]
)

daily_metrics_job = dg.define_asset_job(
    name="daily_metrics_job",
    selection=[daily_metrics]
)

weekly_metrics_job = dg.define_asset_job(
  name="weekly_metrics_job",
  selection=[weekly_metrics]
)

monthly_metrics_job = dg.define_asset_job(
  name="monthly_metrics_job",
  selection=[monthly_metrics]
)

yearly_metrics_job = dg.define_asset_job(
  name="yearly_metrics_job",
  selection=[yearly_metrics]
)

@dg.schedule(
    job=hourly_metrics_job,
    cron_schedule="5 * * * *",
)
def hourly_metrics_schedule(context):
    """Process previous hours' metrics data."""
    previous_hour = context.scheduled_execution_time.date() - timedelta(hours=1)
    date = previous_hour.strftime("%Y-%m-%d")

    return dg.RunRequest(
        run_key=date,
        partition_key=date,
    )

@dg.schedule(
    job=daily_metrics_job,
    cron_schedule="5 0 * * *",
)
def daily_metrics_schedule(context):
    """Process previous day's metrics data."""
    previous_day = context.scheduled_execution_time.date() - timedelta(days=1)
    partition_key = previous_day.strftime("%Y-%m-%d")

    return dg.RunRequest(
        run_key=partition_key,
        partition_key=partition_key,
    )

@dg.schedule(
    job=weekly_metrics_job,
    cron_schedule="5 0 * * 1"
)
def weekly_metrics_schedule(context):
    """Process previous week's metrics data."""
    previous_day = context.scheduled_execution_time.date() - timedelta(weeks=1)
    partition_key = previous_day.strftime("%Y-%m-%d")

    return dg.RunRequest(
        run_key=partition_key,
        partition_key=partition_key,
    )


@dg.schedule(
    job=monthly_metrics_job,
    cron_schedule="5 0 1 * *",
)
def monthly_metrics_schedule(context):
    """Process previous month's metrics data."""
    previous_day = context.scheduled_execution_time.date() - timedelta(days=30)
    partition_key = previous_day.strftime("%Y-%m-%d")

    return dg.RunRequest(
        run_key=partition_key,
        partition_key=partition_key,
    )

@dg.schedule(
    job=yearly_metrics_job,
    cron_schedule="5 0 1 1 *",
)
def yearly_metrics_schedule(context):
    """Process previous year's metrics data."""
    previous_day = context.scheduled_execution_time.date() - timedelta(days=365)
    partition_key = previous_day.strftime("%Y-%m-%d")

    return dg.RunRequest(
        run_key=partition_key,
        partition_key=partition_key,
    )

