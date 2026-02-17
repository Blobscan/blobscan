from datetime import datetime, timedelta
from pathlib import Path
import time

import dagster as dg
from sqlalchemy import text

from .resources.postgres import PostgresResource
from .sources import transaction, block, address, blob, blobs_on_transactions, transaction_fork

SQL_DIR = Path(__file__).parent / "sql"

AGGREGATE_TX_SQL = text((SQL_DIR / "aggregate_tx_hourly.sql").read_text())
AGGREGATE_BLOB_SQL = text((SQL_DIR / "aggregate_blob_hourly.sql").read_text())

hourly_partitions = dg.HourlyPartitionsDefinition(start_date="2024-03-13-00:00")


@dg.asset(
    deps=[transaction, block, address, blob, blobs_on_transactions, transaction_fork],
    partitions_def=hourly_partitions,
)
def hourly_metrics(context: dg.AssetExecutionContext, postgres: PostgresResource) -> dg.MaterializeResult:
    partition_start = datetime.strptime(context.partition_key, "%Y-%m-%d-%H:%M")
    partition_end = partition_start + timedelta(hours=1)


    with postgres.get_connection() as conn:
        params = {"from": partition_start, "to": partition_end}

        tx_query_start = time.perf_counter()
        tx_query_result = conn.execute(AGGREGATE_TX_SQL, params)
        tx_query_end = time.perf_counter()


        blob_query_start = time.perf_counter()
        blob_query_result = conn.execute(AGGREGATE_BLOB_SQL, params)
        blob_query_end = time.perf_counter()


        conn.commit()

    blob_query_ms = (blob_query_end - blob_query_start) * 1000
    tx_query_ms = (tx_query_end - tx_query_start) * 1000
    total_queries_ms = (blob_query_end - tx_query_start) * 1000

    return dg.MaterializeResult(
        metadata={
            "partition": context.partition_key,
            "rows_affected": dg.MetadataValue.int(int(tx_query_result.returns_rows)),
            "blob_rows_affected": dg.MetadataValue.int(int(blob_query_result.returns_rows)),
            "blob_query_ms": dg.MetadataValue.int(int(blob_query_ms)),
            "tx_query_ms": dg.MetadataValue.int(int(tx_query_ms)),
            "query_ms": dg.MetadataValue.int(int(total_queries_ms))

        }
    )

hourly_metrics_job = dg.define_asset_job(
    name="hourly_metrics_job",
    selection=[hourly_metrics]
)
@dg.schedule(
    job=hourly_metrics_job,
    cron_schedule="5 * * * *",
)

def hourly_metrics_schedule(context):
    """Process previous hours' metrics data."""
    previous_day = context.scheduled_execution_time.date() - timedelta(hours=1)
    date = previous_day.strftime("%Y-%m-%d")
    return dg.RunRequest(
        run_key=date,
        partition_key=date,
    )
