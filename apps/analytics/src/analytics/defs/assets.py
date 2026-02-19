from pathlib import Path
import time

from analytics.defs.asset_factories import make_metrics_asset
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


hourly_partitions = dg.HourlyPartitionsDefinition(start_date="2024-03-13-00:00")
daily_partitions = dg.DailyPartitionsDefinition(start_date="2024-03-13", fmt="%Y-%m-%d")
weekly_partitions = dg.WeeklyPartitionsDefinition(start_date="2024-03-13", fmt="%Y-%m-%d")
monthly_partitions = dg.MonthlyPartitionsDefinition(start_date="2024-03", fmt="%Y-%m")
yearly_partitions = dg.TimeWindowPartitionsDefinition(
    start="2024",
    cron_schedule="0 0 1 1 *",  # every Jan 1st
    fmt="%Y",
)

@dg.asset(
    deps=[transaction, block, address, blob, blobs_on_transactions, transaction_fork],
    partitions_def=hourly_partitions,
    automation_condition=dg.AutomationCondition.on_cron("5 * * * *"),
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

daily_metrics = make_metrics_asset(
    name="daily_metrics",
    deps=[hourly_metrics],
    partitions_def=daily_partitions,
    sql=build_aggregate_sql(
      "hourly_metrics", "daily_metrics", "day"
    ),
    automation_condition=dg.AutomationCondition.eager(),
    backfill_policy=dg.BackfillPolicy.multi_run(30),
)

weekly_metrics = make_metrics_asset(
    name="weekly_metrics",
    deps=[daily_metrics],
    partitions_def=weekly_partitions,
    sql=build_aggregate_sql(
      "daily_metrics", "weekly_metrics", "week"
    ),
    automation_condition=dg.AutomationCondition.eager(),
    backfill_policy=dg.BackfillPolicy.multi_run(30),
)

monthly_metrics = make_metrics_asset(
    name="monthly_metrics",
    deps=[daily_metrics],
    partitions_def=monthly_partitions,
    sql=build_aggregate_sql(
      "daily_metrics", "monthly_metrics", "month"
    ),
    automation_condition=dg.AutomationCondition.eager(),
    backfill_policy=dg.BackfillPolicy.multi_run(12),
)

yearly_metrics = make_metrics_asset(
    name="yearly_metrics",
    deps=[monthly_metrics],
    partitions_def=yearly_partitions,
    sql=build_aggregate_sql(
      "monthly_metrics", "yearly_metrics", "year"
    ),
    automation_condition=dg.AutomationCondition.eager(),
)
