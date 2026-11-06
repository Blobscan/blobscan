from __future__ import annotations

import os
import time
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from collections.abc import Sequence

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


TRUNC_UNITS = frozenset({"day", "week", "month", "year"})


def build_aggregate_sql(source: str, target: str, trunc: str):
    if trunc not in TRUNC_UNITS:
        msg = f"Invalid trunc {trunc!r}, expected one of {sorted(TRUNC_UNITS)}"
        raise ValueError(msg)

    sql = (
        SQL_TEMPLATE.replace("{{source_table}}", source)
        .replace("{{target_table}}", target)
        .replace("{{trunc}}", trunc)
    )
    # Fail at import time rather than with a Postgres syntax error at run time
    if "{{" in sql or "}}" in sql:
        msg = "Unresolved placeholder in aggregate SQL template"
        raise ValueError(msg)

    return text(sql)


AGGREGATE_TX_HOURLY_SQL = text((SQL_DIR / "aggregate_tx_hourly.sql").read_text())
AGGREGATE_BLOB_HOURLY_SQL = text((SQL_DIR / "aggregate_blob_hourly.sql").read_text())
AGGREGATE_ETH_PRICE_HOURLY_SQL = text(
    (SQL_DIR / "aggregate_eth_price_hourly.sql").read_text(),
)
AGGREGATE_ALL_TIME_SQL = text((SQL_DIR / "aggregate_all_time.sql").read_text())

ADDRESS_SQL_TEMPLATE = (SQL_DIR / "aggregate_address.sql").read_text()
ADDRESS_TRUNC_UNITS = frozenset({"hour", "day"})

AGGREGATE_ADDRESS_ALL_TIME_SQL = text(
    (SQL_DIR / "aggregate_address_all_time.sql").read_text(),
)

# address_hourly_metrics keeps only this period. The charts use hourly rows
# only for the 1d and 7d time frames, and address_daily_metrics keeps the full
# history.
ADDRESS_HOURLY_RETENTION = timedelta(days=30)


def build_address_sql(target: str, trunc: str):
    """Return the address metrics SQL that writes ``target`` per ``trunc``."""
    if trunc not in ADDRESS_TRUNC_UNITS:
        msg = f"Invalid trunc {trunc!r}, expected one of {sorted(ADDRESS_TRUNC_UNITS)}"
        raise ValueError(msg)

    sql = ADDRESS_SQL_TEMPLATE.replace("{{target_table}}", target).replace(
        "{{trunc}}", trunc,
    )
    if "{{" in sql or "}}" in sql:
        msg = "Unresolved placeholder in address SQL template"
        raise ValueError(msg)

    return text(sql)


def address_hourly_retention_cutoff(now: datetime | None = None) -> datetime:
    """Return the start of the oldest hour that address_hourly_metrics keeps."""
    now = now or datetime.now(UTC)
    cutoff = now - ADDRESS_HOURLY_RETENTION
    return cutoff.replace(minute=0, second=0, microsecond=0)


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


def execute_sqls_window(
    *,
    context: dg.AssetExecutionContext,
    postgres: PostgresResource,
    sqls: Sequence[TextClause],
    table: str,
    window: tuple[datetime, datetime] | None = None,
) -> list[tuple[int, int]]:
    """Replace ``table`` rows in the partition window with the result of ``sqls``.

    The delete and all statements run in one transaction, in order. Returns
    (rowcount, elapsed_ms) for each statement; the time of the delete is
    added to the first one. ``window`` replaces the partition window, for
    example to process only a part of it.
    """
    start, end = window or (
        context.partition_time_window.start,
        context.partition_time_window.end,
    )
    params = {"from": start, "to": end}

    results = []
    with postgres.transaction() as conn:
        t0 = time.perf_counter()
        delete_window(conn, table, params)
        for sql in sqls:
            res = conn.execute(sql, params)
            t1 = time.perf_counter()
            results.append((res.rowcount, int((t1 - t0) * 1000)))
            t0 = t1

    return results


def execute_sql_window(
    *,
    context: dg.AssetExecutionContext,
    postgres: PostgresResource,
    sql: TextClause,
    table: str,
    window: tuple[datetime, datetime] | None = None,
) -> tuple[int, int]:
    """Replace ``table`` rows in the partition window with the result of ``sql``.

    Returns (rowcount, elapsed_ms).
    """
    [result] = execute_sqls_window(
        context=context, postgres=postgres, sqls=[sql], table=table, window=window,
    )
    return result


def execute_full_refresh(
    *,
    postgres: PostgresResource,
    sql: TextClause,
    table: str,
) -> tuple[int, int]:
    """Replace every row of ``table`` with the result of ``sql``.

    The delete drops groups (e.g. a rollup) that no longer have data. Both run
    in one transaction, so readers see the old rows until it commits.
    Returns (rowcount, elapsed_ms).
    """
    with postgres.transaction() as conn:
        t0 = time.perf_counter()
        conn.execute(text(f"DELETE FROM {table}"))  # noqa: S608 - table names are internal constants
        res = conn.execute(sql)
        ms = int((time.perf_counter() - t0) * 1000)

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
