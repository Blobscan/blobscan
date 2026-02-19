import time
import dagster as dg
from sqlalchemy.sql.elements import TextClause


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