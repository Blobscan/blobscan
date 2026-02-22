from pathlib import Path
import time
import dagster as dg
from sqlalchemy import text
from sqlalchemy.sql.elements import TextClause

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