from __future__ import annotations

import os
import time
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    import dagster as dg
    from sqlalchemy.engine import Connection
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


def delete_window(conn: Connection, table: str, params: dict) -> None:
    """Delete the rows of ``table`` within the [from, to) window.

    Run in the same transaction as the aggregate SQL so a re-aggregation fully
    replaces the window: groups that no longer have data (e.g. after a reorg)
    are removed instead of keeping their stale values.
    """
    conn.execute(
        text(
            f"DELETE FROM {table} "  # noqa: S608 - table names are internal constants
            "WHERE period_start >= :from AND period_start < :to",
        ),
        params,
    )


def execute_sql_window(
    *,
    context: dg.AssetExecutionContext,
    postgres: PostgresResource,
    sql: TextClause,
    table: str,
) -> tuple[int, int]:
    """Replace ``table`` rows in the partition window with the result of ``sql``.

    Returns (rowcount, elapsed_ms).
    """
    start = context.partition_time_window.start
    end = context.partition_time_window.end
    params = {"from": start, "to": end}

    with postgres.get_connection() as conn:
        t0 = time.perf_counter()
        delete_window(conn, table, params)
        res = conn.execute(sql, params)
        t1 = time.perf_counter()
        conn.commit()

    ms = int((t1 - t0) * 1000)
    return res.rowcount, ms


def start_of_week(dt: datetime) -> datetime:
    """Return midnight of the Monday that starts ``dt``'s week.

    Single Python definition of a week; it must match Postgres
    ``DATE_TRUNC('week', ...)`` (ISO weeks, starting on Monday), which the
    aggregate SQL uses to bucket weekly metrics.
    """
    midnight = dt.replace(hour=0, minute=0, second=0, microsecond=0)
    return midnight - timedelta(days=midnight.weekday())


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

    raw_chain_id = os.getenv("CHAIN_ID", "").strip()
    try:
        chain_id = int(raw_chain_id)
    except ValueError:
        msg = (
            f"Invalid CHAIN_ID={raw_chain_id!r}.\n"
            "Set CHAIN_ID to a numeric chain id, or set DAGSTER_METRICS_START_DATE."
        )
        raise ValueError(msg) from None

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
