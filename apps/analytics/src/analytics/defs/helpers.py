from datetime import datetime, timezone
import os
from pathlib import Path
import time
import dagster as dg
from sqlalchemy import text
from sqlalchemy.sql.elements import TextClause

SQL_DIR = Path(__file__).parent / "sql"

SQL_TEMPLATE = (SQL_DIR / "aggregate.sql").read_text()

DENCUN_ACTIVATION = {
    1: "2024-03-13-13:55",
    11155111: "2024-01-30-22:51",
    560048: "2025-03-17-12:00",
    100: "2024-03-11-18:30"
}

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


def partition_meta(context: dg.AssetExecutionContext) -> str | None:
    pk_range = getattr(context, "partition_key_range", None)
    if pk_range:
        return f"{pk_range.start}..{pk_range.end}"
    return getattr(context, "partition_key", None)

def execute_sql_window(
    *,
    context: dg.AssetExecutionContext,
    postgres,
    sql: TextClause,
) -> tuple[int, int]:
    """Executes a single SQL statement for the partition window.
    Returns (rowcount, elapsed_ms).
    """
    start = context.partition_time_window.start
    end = context.partition_time_window.end
    params = {"from": start, "to": end}

    with postgres.get_connection() as conn:
        t0 = time.perf_counter()
        res = conn.execute(sql, params)
        t1 = time.perf_counter()
        conn.commit()

    ms = int((t1 - t0) * 1000)
    return res.rowcount, ms



    
def get_partition_start_date() -> str:
    custom_start_date = os.getenv("DAGSTER_METRICS_START_DATE")

    if custom_start_date:
        try:
            datetime.strptime(custom_start_date, "%Y-%m-%d-%H:%M")
        except ValueError:
            try:
                datetime.strptime(custom_start_date, "%Y-%m-%d")
            except ValueError:
                raise ValueError(
                    "Invalid DAGSTER_METRICS_START_DATE format.\n"
                    "Use YYYY-MM-DD or YYYY-MM-DD-HH:MM."
                )
        return custom_start_date

    chain_id = int(os.getenv("CHAIN_ID", ""))

    try:
        activation_date = DENCUN_ACTIVATION[chain_id]

        return datetime.strptime(
            activation_date,
            "%Y-%m-%d-%H:%M"
        ).replace(tzinfo=timezone.utc)
        
    except KeyError:
        raise ValueError(
            f"Partition start date could not be determined.\n"
            f"- DAGSTER_METRICS_START_DATE not set\n"
            f"- No Dencun activation date configured for CHAIN_ID={chain_id}\n\n"
            "Fix:\n"
            "• set DAGSTER_METRICS_START_DATE env var, or\n"
            "• add the chain to DENCUN_ACTIVATION."
        )