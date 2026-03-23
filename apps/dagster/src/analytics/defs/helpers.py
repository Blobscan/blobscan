from __future__ import annotations

import os
import time
from datetime import UTC, datetime
from pathlib import Path
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    import dagster as dg
    from sqlalchemy.sql.elements import TextClause

    from analytics.defs.resources.postgres import PostgresResource

from sqlalchemy import text

SQL_DIR = Path(__file__).parent / "sql"

SQL_TEMPLATE = (SQL_DIR / "aggregate.sql").read_text()

DENCUN_ACTIVATION = {
    1: "2024-03-13T13:55",
    11155111: "2024-01-30T22:51",
    560048: "2025-03-17T12:00",
    100: "2024-03-11T18:30",
}


def build_aggregate_sql(source: str, target: str, trunc: str):
    return text(
        SQL_TEMPLATE.replace("{{source_table}}", source)
        .replace("{{target_table}}", target)
        .replace("{{trunc}}", trunc),
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
    postgres: PostgresResource,
    sql: TextClause,
) -> tuple[int, int]:
    """Execute a single SQL statement for the partition window.

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


def get_partition_start_date() -> datetime:
    custom_start_date = os.getenv("DAGSTER_METRICS_START_DATE")

    if custom_start_date:
        try:
            return datetime.strptime(custom_start_date, "%Y-%m-%dT%H:%M").replace(
                tzinfo=UTC,
            )
        except ValueError:
            try:
                return datetime.strptime(custom_start_date, "%Y-%m-%d").replace(
                    tzinfo=UTC,
                )
            except ValueError:
                msg = (
                    "Invalid DAGSTER_METRICS_START_DATE format.\n"
                    "Use YYYY-MM-DD or YYYY-MM-DDTHH:MM."
                )
                raise ValueError(msg) from None

    chain_id = int(os.getenv("CHAIN_ID", ""))

    try:
        activation_date = DENCUN_ACTIVATION[chain_id]

        return datetime.strptime(activation_date, "%Y-%m-%dT%H:%M").replace(
            tzinfo=UTC,
        )

    except KeyError:
        msg = (
            f"Partition start date could not be determined.\n"
            f"- DAGSTER_METRICS_START_DATE not set\n"
            f"- No Dencun activation date configured for CHAIN_ID={chain_id}\n\n"
            "Fix:\n"
            "• set DAGSTER_METRICS_START_DATE env var, or\n"
            "• add the chain to DENCUN_ACTIVATION."
        )
        raise ValueError(msg) from None
