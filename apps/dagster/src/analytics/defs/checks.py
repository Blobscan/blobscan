"""Asset checks of the network metrics tables.

The checks find metrics that are wrong although every run succeeded:

- ``hourly_metrics:matches_source_tables``: the hourly counts differ from the
  source tables, for example after a reorg or late indexing that the hourly
  catch-up schedule no longer covers.
- ``hourly_metrics:data_is_fresh``: the newest aggregated block is too old,
  for example because the indexer has stopped.
- ``<level>_metrics:sums_match_<source>``: a rollup row is not the sum of the
  rows it is aggregated from.
- ``hourly_metrics:dimensions_add_up``: the category or rollup rows of an hour
  do not add up to the global or to the ``rollup`` category row.

The checks are not partitioned: each one reads the recent periods only, so its
cost does not grow with the history. The checks of the
``network_metrics_history`` asset run the same comparisons on every period,
once a week, and can also be executed by hand. They run from their own automation
condition (a cron tick), so they do not run with the live, catch-up and cascade
runs of their assets. See docs/operations.md.

The metrics and source tables store their times without a time zone (UTC) or
as dates. The parameters are passed as naive UTC datetimes and as dates, so
the comparisons do not depend on the time zone of the database session.
"""

from __future__ import annotations

import os
from datetime import UTC, date, datetime, timedelta
from decimal import Decimal
from typing import TYPE_CHECKING, Any

import dagster as dg
from sqlalchemy import text

from analytics.defs.assets import (
    daily_metrics,
    hourly_metrics,
    hourly_partitions,
    monthly_metrics,
    weekly_metrics,
    yearly_metrics,
)
from analytics.defs.helpers import SQL_DIR, start_of_week
from analytics.defs.resources.postgres import PostgresResource
from analytics.defs.schedules import CATCH_UP_HOURS

if TYPE_CHECKING:
    from collections.abc import Mapping, Sequence

    from sqlalchemy.engine import Connection
    from sqlalchemy.sql.elements import TextClause

# The consistency checks run once an hour, after the catch-up runs of :05 and
# the cascade that follows them.
CONSISTENCY_CHECKS_CRON = "20 * * * *"
# Every 10 minutes, a few minutes after each live hourly run.
FRESHNESS_CHECK_CRON = "7-59/10 * * * *"
# The full-history checks run once a week, on Sundays at 04:40 UTC, a quiet
# time away from the hourly checks at :20.
FULL_HISTORY_CHECKS_CRON = "40 4 * * 0"
# The first period of a full-history rollup check. It is before the first
# partition, and a period boundary of every level.
FULL_HISTORY_START_DATE = date(2000, 1, 1)

# The hours that the source check compares, before the hours that the hourly
# catch-up schedule still re-aggregates.
SOURCE_CHECK_HOURS = 48

# The hours that the dimension check compares, up to the in-progress hour. A
# run writes all the rows of an hour in one statement, so the open hours can
# be compared too.
DIMENSION_CHECK_HOURS = 48

# The number of closed periods that each rollup check compares. The older
# periods change only with a backfill, and its cascade rewrites their rollups.
ROLLUP_CHECK_PERIODS = {"day": 14, "week": 8, "month": 6, "year": 2}

# A rollup period is compared only when it closed at least this long ago, so
# the cascade that follows its last update has time to complete.
ROLLUP_CHECK_GRACE = timedelta(hours=1)

MAX_LAG_ENV_VAR = "DAGSTER_METRICS_MAX_LAG_MINUTES"
DEFAULT_MAX_LAG_MINUTES = 60
# How far back the freshness check looks for the newest block.
FRESHNESS_LOOKBACK = timedelta(days=2)

# The number of mismatching rows that a check result shows.
MAX_REPORTED_MISMATCHES = 20

# The columns that aggregate.sql sums, and that have an exact type (INTEGER,
# BIGINT or DECIMAL). The DOUBLE PRECISION columns (ETH prices, USD fees) are
# left out, because their sums are rounded.
ROLLUP_COLUMNS = (
    "total_blob_gas_price",
    "total_blocks",
    "total_eth_price_count",
    "total_transactions",
    "total_unique_receivers",
    "total_unique_senders",
    "total_blob_gas_used",
    "total_blob_as_calldata_gas_used",
    "total_blob_base_fee",
    "total_blob_max_fee",
    "total_blob_as_calldata_fee",
    "total_blob_as_calldata_max_fee",
    "total_max_blob_gas_fee",
    "total_blobs",
    "total_unique_blobs",
    "total_blob_size",
    "total_blob_usage_size",
    "total_usd_priced_transactions",
)

# The columns whose category rows add up to the global row, and whose rollup
# rows add up to the "rollup" category row. Not in the list:
# - total_unique_receivers and total_unique_blobs: a receiver or a blob that
#   first appears in transactions of two categories (or rollups) is counted
#   once in each of them, and once in the global row.
# - the global-only columns (blocks, blob gas price, ETH price), which only
#   the global row has.
# total_unique_senders adds up: the category and the rollup of a transaction
# are the ones of its sender.
DIMENSION_COLUMNS = (
    "total_transactions",
    "total_unique_senders",
    "total_blob_gas_used",
    "total_blob_as_calldata_gas_used",
    "total_blob_base_fee",
    "total_blob_max_fee",
    "total_blob_as_calldata_fee",
    "total_blob_as_calldata_max_fee",
    "total_max_blob_gas_fee",
    "total_blobs",
    "total_blob_size",
    "total_blob_usage_size",
    "total_usd_priced_transactions",
)

SOURCE_CHECK_SQL = text((SQL_DIR / "check_hourly_source.sql").read_text())

FRESHNESS_SQL = text(
    """
    SELECT
      (
        SELECT MAX(last_block_timestamp) FROM hourly_metrics
        WHERE category IS NULL AND rollup IS NULL AND period_start >= :since
      ) AS metrics_latest,
      (
        SELECT MAX(block_timestamp) FROM transaction
        WHERE block_timestamp >= :since
      ) AS source_latest
    """,
)


# The full-history checks target this asset, not the metrics assets: Dagster
# runs the checks of an asset with each backfill and Materialize run of it,
# and these checks read the whole tables. Nothing materializes this asset.
network_metrics_history = dg.AssetSpec(
    "network_metrics_history",
    deps=[hourly_metrics, daily_metrics, weekly_metrics, monthly_metrics,
          yearly_metrics],
    description=(
        "The whole history of the network metrics. Its checks compare every"
        " period once a week. Nothing materializes it."
    ),
)


def _on_cron(cron_schedule: str) -> dg.AutomationCondition[dg.AssetCheckKey]:
    """Return a condition that runs a check once at each tick of ``cron_schedule``."""
    return dg.AutomationCondition.cron_tick_passed(cron_schedule)


def _differing_columns_sql(
    columns: Sequence[str],
    left: str,
    right: str,
    *,
    missing_as_zero: bool = False,
) -> str:
    """Return an SQL array of the names of the columns that differ."""

    def value(alias: str, column: str) -> str:
        ref = f"{alias}.{column}"
        return f"COALESCE({ref}, 0)" if missing_as_zero else ref

    cases = ",\n      ".join(
        f"CASE WHEN {value(left, c)} IS DISTINCT FROM {value(right, c)} "
        f"THEN '{c}' END"
        for c in columns
    )
    return f"ARRAY_REMOVE(ARRAY[\n      {cases}\n    ]::TEXT[], NULL)"


def build_rollup_check_sql(source: str, target: str, trunc: str) -> TextClause:
    """Return the rows of ``target`` that are not the sum of ``source``.

    Only the periods in [``:from``, ``:to``) are compared. Both are dates.
    A group that is only in ``source`` is "missing", one that is only in
    ``target`` is "extra". The table names and ``trunc`` are internal
    constants.
    """
    sums = ",\n    ".join(f"SUM({c}) AS {c}" for c in ROLLUP_COLUMNS)
    columns = ", ".join(ROLLUP_COLUMNS)
    differing = _differing_columns_sql(ROLLUP_COLUMNS, "e", "a")
    # The rollup tables store period_start as a DATE. DATE_TRUNC of a DATE
    # gives a TIMESTAMPTZ, so the period is cast to a DATE for an exact join,
    # and returned as a TIMESTAMP for every level. The categories and rollups
    # are NULL in the global rows: a FULL JOIN needs an equality condition
    # (IS NOT DISTINCT FROM is not accepted).
    return text(
        f"""
WITH expected AS (
  SELECT
    DATE_TRUNC('{trunc}', period_start)::DATE AS period_start,
    category,
    rollup,
    {sums}
  FROM {source}
  WHERE period_start >= :from AND period_start < :to
  GROUP BY DATE_TRUNC('{trunc}', period_start), category, rollup
),
actual AS (
  SELECT period_start, category, rollup, {columns}
  FROM {target}
  WHERE period_start >= :from AND period_start < :to
),
compared AS (
  SELECT
    COALESCE(e.period_start, a.period_start) AS period_start,
    COALESCE(e.category, a.category) AS category,
    COALESCE(e.rollup, a.rollup) AS rollup,
    CASE
      WHEN a.period_start IS NULL THEN 'missing'
      WHEN e.period_start IS NULL THEN 'extra'
      ELSE 'differs'
    END AS problem,
    {differing} AS columns
  FROM expected e
  FULL JOIN actual a
    ON a.period_start = e.period_start
    AND COALESCE(a.category::TEXT, '') = COALESCE(e.category::TEXT, '')
    AND COALESCE(a.rollup::TEXT, '') = COALESCE(e.rollup::TEXT, '')
)
SELECT
  period_start::TIMESTAMP AS period_start,
  category::TEXT AS category,
  rollup::TEXT AS rollup,
  problem,
  columns
FROM compared
WHERE problem <> 'differs' OR CARDINALITY(columns) > 0
ORDER BY period_start, category NULLS FIRST, rollup NULLS FIRST
""",  # noqa: S608 - table names, columns and trunc are internal constants
    )


def build_dimension_check_sql() -> TextClause:
    """Return the hours whose dimension rows do not add up.

    Two comparisons for each hour: the category rows against the global row,
    and the rollup rows against the "rollup" category row. A missing row
    counts as zeros. Only the hours from ``:from`` are compared.
    """
    columns = ", ".join(DIMENSION_COLUMNS)
    sums = ", ".join(f"SUM({c}) AS {c}" for c in DIMENSION_COLUMNS)
    total_vs_parts = _differing_columns_sql(
        DIMENSION_COLUMNS, "t", "p", missing_as_zero=True,
    )
    return text(
        f"""
WITH global_rows AS (
  SELECT period_start, {columns} FROM hourly_metrics
  WHERE category IS NULL AND rollup IS NULL AND period_start >= :from
),
category_sums AS (
  SELECT period_start, {sums} FROM hourly_metrics
  WHERE category IS NOT NULL AND rollup IS NULL AND period_start >= :from
  GROUP BY period_start
),
rollup_category_rows AS (
  SELECT period_start, {columns} FROM hourly_metrics
  WHERE category = 'rollup' AND rollup IS NULL AND period_start >= :from
),
rollup_sums AS (
  SELECT period_start, {sums} FROM hourly_metrics
  WHERE rollup IS NOT NULL AND period_start >= :from
  GROUP BY period_start
),
compared AS (
  SELECT
    period_start,
    'categories add up to the global row' AS comparison,
    {total_vs_parts} AS columns
  FROM global_rows t FULL JOIN category_sums p USING (period_start)
  UNION ALL
  SELECT
    period_start,
    'rollups add up to the rollup category row' AS comparison,
    {total_vs_parts} AS columns
  FROM rollup_category_rows t FULL JOIN rollup_sums p USING (period_start)
)
SELECT period_start, comparison, columns
FROM compared
WHERE CARDINALITY(columns) > 0
ORDER BY period_start, comparison
""",  # noqa: S608 - columns are internal constants
    )


DIMENSION_CHECK_SQL = build_dimension_check_sql()


def _as_utc(value: datetime) -> datetime:
    """Return a naive database TIMESTAMP (always UTC) as an aware datetime."""
    return value.replace(tzinfo=UTC) if value.tzinfo is None else value


def _db_timestamp(value: datetime) -> datetime:
    """Return an aware datetime as a naive UTC datetime, for a TIMESTAMP column."""
    return value.astimezone(UTC).replace(tzinfo=None)


def _floor_hour(value: datetime) -> datetime:
    return value.replace(minute=0, second=0, microsecond=0)


def _jsonable(row: Mapping[str, Any]) -> dict[str, Any]:
    def convert(value: object) -> object:
        if isinstance(value, datetime):
            return _as_utc(value).isoformat()
        if isinstance(value, Decimal):
            return str(value)
        if isinstance(value, (list, tuple)):
            return [convert(v) for v in value]
        return value

    return {key: convert(value) for key, value in row.items()}


def _fetch(conn: Connection, sql: TextClause, params: dict) -> list[dict[str, Any]]:
    return [dict(row) for row in conn.execute(sql, params).mappings()]


def _mismatch_metadata(rows: Sequence[Mapping[str, Any]]) -> dict[str, Any]:
    return {
        "mismatches": dg.MetadataValue.int(len(rows)),
        "first_mismatches": dg.MetadataValue.json(
            [_jsonable(row) for row in rows[:MAX_REPORTED_MISMATCHES]],
        ),
    }


def _period(row: Mapping[str, Any]) -> str:
    return _as_utc(row["period_start"]).strftime("%Y-%m-%dT%H:%M")


# ---------------------------------------------------------------------------
# hourly_metrics compared with the source tables
# ---------------------------------------------------------------------------


def source_check_window(
    now: datetime, *, full_history: bool = False,
) -> tuple[datetime, datetime]:
    """Return the [start, end) hours that the source check compares.

    It ends before the hours that the hourly catch-up schedule re-aggregates,
    which can still change, and starts no earlier than the partitions. With
    ``full_history``, it starts at the partitions.
    """
    end = _floor_hour(now) - timedelta(hours=CATCH_UP_HOURS)
    if full_history:
        return hourly_partitions.start, end
    start = max(end - timedelta(hours=SOURCE_CHECK_HOURS), hourly_partitions.start)
    return start, end


def find_source_mismatches(
    conn: Connection, start: datetime, end: datetime,
) -> list[dict[str, Any]]:
    return _fetch(
        conn,
        SOURCE_CHECK_SQL,
        {"from": _db_timestamp(start), "to": _db_timestamp(end)},
    )


def evaluate_source_check(
    conn: Connection, now: datetime, *, full_history: bool = False,
) -> dg.AssetCheckResult:
    start, end = source_check_window(now, full_history=full_history)
    window = f"{start.isoformat()}..{end.isoformat()}"
    if start >= end:
        return dg.AssetCheckResult(
            passed=True,
            description="No hour to compare yet.",
            metadata={"window": dg.MetadataValue.text(window)},
        )

    rows = find_source_mismatches(conn, start, end)
    description = (
        f"{len(rows)} hour(s) of hourly_metrics differ from the source tables"
        f" (first: {_period(rows[0])}). Backfill hourly_metrics and the levels"
        " downstream of it for these hours."
        if rows
        else "The hourly counts match the source tables."
    )
    return dg.AssetCheckResult(
        passed=not rows,
        severity=dg.AssetCheckSeverity.WARN,
        description=description,
        metadata={
            "window": dg.MetadataValue.text(window),
            **_mismatch_metadata(rows),
        },
    )


@dg.asset_check(
    asset=hourly_metrics,
    name="matches_source_tables",
    description=(
        "The transactions, blocks and blobs of each global hourly row match the"
        f" source tables, for the last {SOURCE_CHECK_HOURS} hours before the"
        " hours that the catch-up schedule re-aggregates."
    ),
    automation_condition=_on_cron(CONSISTENCY_CHECKS_CRON),
)
def hourly_metrics_matches_source_tables(
    postgres: PostgresResource,
) -> dg.AssetCheckResult:
    with postgres.get_connection() as conn:
        return evaluate_source_check(conn, datetime.now(UTC))


@dg.asset_check(
    asset=network_metrics_history.key,
    name="hourly_metrics_matches_source_tables",
    description=(
        "hourly_metrics:matches_source_tables for every hour from the first"
        " partition, once a week."
    ),
    automation_condition=_on_cron(FULL_HISTORY_CHECKS_CRON),
)
def hourly_metrics_matches_source_tables_full_history(
    postgres: PostgresResource,
) -> dg.AssetCheckResult:
    with postgres.get_connection() as conn:
        return evaluate_source_check(conn, datetime.now(UTC), full_history=True)


# ---------------------------------------------------------------------------
# Freshness of the aggregated data
# ---------------------------------------------------------------------------


def max_data_lag() -> timedelta:
    raw = os.getenv(MAX_LAG_ENV_VAR, "").strip()
    if not raw:
        return timedelta(minutes=DEFAULT_MAX_LAG_MINUTES)
    try:
        minutes = int(raw)
    except ValueError:
        minutes = 0
    if minutes <= 0:
        msg = f"Invalid {MAX_LAG_ENV_VAR}={raw!r}: use a positive number of minutes."
        raise ValueError(msg)
    return timedelta(minutes=minutes)


def _minutes(delta: timedelta) -> int:
    return int(delta.total_seconds() // 60)


def evaluate_freshness_check(
    conn: Connection, now: datetime, max_lag: timedelta,
) -> dg.AssetCheckResult:
    since = _db_timestamp(now - FRESHNESS_LOOKBACK)
    row = conn.execute(FRESHNESS_SQL, {"since": since}).one()

    metrics_latest = _as_utc(row.metrics_latest) if row.metrics_latest else None
    source_latest = _as_utc(row.source_latest) if row.source_latest else None
    passed = metrics_latest is not None and now - metrics_latest <= max_lag

    if metrics_latest is None:
        description = "No block aggregated in the last 2 days."
    else:
        description = (
            f"The newest aggregated block is {_minutes(now - metrics_latest)}"
            " minutes old"
            + ("." if passed else f", more than {_minutes(max_lag)} minutes.")
        )

    if not passed:
        # The pipeline is behind when the indexer has newer transactions, also
        # when the indexer is stale itself.
        if source_latest is not None and (
            metrics_latest is None or source_latest > metrics_latest
        ):
            description += (
                " The indexer has newer transactions"
                f" ({_minutes(now - source_latest)} minutes old), so the"
                " metrics pipeline is behind."
            )
            if now - source_latest > max_lag:
                description += (
                    " The indexer has not indexed a recent blob transaction"
                    " either: it may have stopped too."
                )
        else:
            description += (
                " No newer blob transaction is indexed either: the indexer has"
                " stopped, or the chain has had no blob transaction."
            )

    metadata: dict[str, Any] = {
        "max_lag_minutes": dg.MetadataValue.int(_minutes(max_lag)),
    }
    if metrics_latest is not None:
        metadata["newest_aggregated_block"] = dg.MetadataValue.text(
            metrics_latest.isoformat(),
        )
    if source_latest is not None:
        metadata["newest_indexed_transaction"] = dg.MetadataValue.text(
            source_latest.isoformat(),
        )

    return dg.AssetCheckResult(
        passed=passed,
        severity=dg.AssetCheckSeverity.ERROR,
        description=description,
        metadata=metadata,
    )


@dg.asset_check(
    asset=hourly_metrics,
    name="data_is_fresh",
    description=(
        "The newest block in hourly_metrics is at most"
        f" {MAX_LAG_ENV_VAR} minutes old (default {DEFAULT_MAX_LAG_MINUTES})."
    ),
    automation_condition=_on_cron(FRESHNESS_CHECK_CRON),
)
def hourly_metrics_data_is_fresh(postgres: PostgresResource) -> dg.AssetCheckResult:
    max_lag = max_data_lag()
    with postgres.get_connection() as conn:
        return evaluate_freshness_check(conn, datetime.now(UTC), max_lag)


# ---------------------------------------------------------------------------
# Rollup levels compared with the level they are aggregated from
# ---------------------------------------------------------------------------


def closed_until(trunc: str, now: datetime) -> datetime:
    """Return the start of the ``trunc`` period of ``now - ROLLUP_CHECK_GRACE``.

    The periods before it are closed, and their cascade has had time to run.
    """
    at = now - ROLLUP_CHECK_GRACE
    midnight = at.replace(hour=0, minute=0, second=0, microsecond=0)
    starts = {
        "day": midnight,
        "week": start_of_week(at),
        "month": midnight.replace(day=1),
        "year": midnight.replace(month=1, day=1),
    }
    return starts[trunc]


def _months_before(value: datetime, months: int) -> datetime:
    index = value.year * 12 + value.month - 1 - months
    return value.replace(year=index // 12, month=index % 12 + 1)


def rollup_check_window(
    trunc: str, now: datetime, *, full_history: bool = False,
) -> tuple[date, date]:
    """Return the [start, end) dates of the closed periods that a check compares.

    With ``full_history``, every closed period is compared.

    The rollup tables store ``period_start`` as a DATE, so the window is
    passed as dates: comparing a DATE with a datetime would depend on the time
    zone of the database session.
    """
    end = closed_until(trunc, now)
    if full_history:
        return FULL_HISTORY_START_DATE, end.date()
    periods = ROLLUP_CHECK_PERIODS[trunc]
    if trunc == "day":
        start = end - timedelta(days=periods)
    elif trunc == "week":
        start = end - timedelta(weeks=periods)
    elif trunc == "month":
        start = _months_before(end, periods)
    else:
        start = end.replace(year=end.year - periods)
    return start.date(), end.date()


def find_rollup_mismatches(
    conn: Connection, sql: TextClause, start: date, end: date,
) -> list[dict[str, Any]]:
    return _fetch(conn, sql, {"from": start, "to": end})


def _build_rollup_check(
    asset: dg.AssetsDefinition,
    source: str,
    trunc: str,
    *,
    full_history: bool = False,
) -> dg.AssetChecksDefinition:
    target = asset.key.to_user_string()
    sql = build_rollup_check_sql(source, target, trunc)
    periods = (
        "every closed period" if full_history
        else f"the last {ROLLUP_CHECK_PERIODS[trunc]} closed periods"
    )
    name = f"sums_match_{source}"

    @dg.asset_check(
        asset=network_metrics_history.key if full_history else asset,
        name=f"{target}_{name}" if full_history else name,
        description=(
            f"Each row of {periods} of {target} is the sum of the {source} rows"
            " of that period." + (" Runs once a week." if full_history else "")
        ),
        automation_condition=_on_cron(
            FULL_HISTORY_CHECKS_CRON if full_history else CONSISTENCY_CHECKS_CRON,
        ),
    )
    def _check(postgres: PostgresResource) -> dg.AssetCheckResult:
        start, end = rollup_check_window(
            trunc, datetime.now(UTC), full_history=full_history,
        )
        with postgres.get_connection() as conn:
            rows = find_rollup_mismatches(conn, sql, start, end)
        return rollup_check_result(target, source, rows, start, end)

    return _check


def rollup_check_result(
    target: str,
    source: str,
    rows: Sequence[Mapping[str, Any]],
    start: date,
    end: date,
) -> dg.AssetCheckResult:
    if rows:
        first = rows[0]
        group = "/".join(
            str(first[key]) for key in ("category", "rollup") if first[key]
        ) or "global"
        detail = (
            ", ".join(first["columns"]) if first["problem"] == "differs"
            else f"row {first['problem']}"
        )
        description = (
            f"{len(rows)} row(s) of {target} are not the sum of {source} (first:"
            f" {_period(first)} {group}: {detail}). Materialize these"
            f" {target} partitions again."
        )
    else:
        description = f"The rows of {target} are the sums of {source}."

    return dg.AssetCheckResult(
        passed=not rows,
        severity=dg.AssetCheckSeverity.WARN,
        description=description,
        metadata={
            "window": dg.MetadataValue.text(f"{start.isoformat()}..{end.isoformat()}"),
            **_mismatch_metadata(rows),
        },
    )


daily_metrics_sums_match = _build_rollup_check(daily_metrics, "hourly_metrics", "day")
weekly_metrics_sums_match = _build_rollup_check(weekly_metrics, "daily_metrics", "week")
monthly_metrics_sums_match = _build_rollup_check(
    monthly_metrics, "daily_metrics", "month",
)
yearly_metrics_sums_match = _build_rollup_check(
    yearly_metrics, "monthly_metrics", "year",
)
daily_metrics_sums_match_full_history = _build_rollup_check(
    daily_metrics, "hourly_metrics", "day", full_history=True,
)
weekly_metrics_sums_match_full_history = _build_rollup_check(
    weekly_metrics, "daily_metrics", "week", full_history=True,
)
monthly_metrics_sums_match_full_history = _build_rollup_check(
    monthly_metrics, "daily_metrics", "month", full_history=True,
)
yearly_metrics_sums_match_full_history = _build_rollup_check(
    yearly_metrics, "monthly_metrics", "year", full_history=True,
)


# ---------------------------------------------------------------------------
# Dimension rows of hourly_metrics
# ---------------------------------------------------------------------------


def dimension_check_start(now: datetime, *, full_history: bool = False) -> datetime:
    """Return the first hour that the dimension check compares."""
    if full_history:
        return hourly_partitions.start
    return _floor_hour(now) - timedelta(hours=DIMENSION_CHECK_HOURS)


def find_dimension_mismatches(
    conn: Connection, start: datetime,
) -> list[dict[str, Any]]:
    return _fetch(conn, DIMENSION_CHECK_SQL, {"from": _db_timestamp(start)})


def dimension_check_result(rows: Sequence[Mapping[str, Any]]) -> dg.AssetCheckResult:
    if rows:
        first = rows[0]
        description = (
            f"{len(rows)} comparison(s) of hourly_metrics do not add up (first:"
            f" {_period(first)}, {first['comparison']}:"
            f" {', '.join(first['columns'])}). A run writes all the rows of an"
            " hour at once, so look for a bug in the hourly SQL before you"
            " backfill these hours."
        )
    else:
        description = "The dimension rows of each hour add up."

    return dg.AssetCheckResult(
        passed=not rows,
        severity=dg.AssetCheckSeverity.WARN,
        description=description,
        metadata=_mismatch_metadata(rows),
    )


@dg.asset_check(
    asset=hourly_metrics,
    name="dimensions_add_up",
    description=(
        f"For each of the last {DIMENSION_CHECK_HOURS} hours, the category rows"
        " add up to the global row, and the rollup rows add up to the rollup"
        " category row."
    ),
    automation_condition=_on_cron(CONSISTENCY_CHECKS_CRON),
)
def hourly_metrics_dimensions_add_up(
    postgres: PostgresResource,
) -> dg.AssetCheckResult:
    start = dimension_check_start(datetime.now(UTC))
    with postgres.get_connection() as conn:
        rows = find_dimension_mismatches(conn, start)
    return dimension_check_result(rows)


@dg.asset_check(
    asset=network_metrics_history.key,
    name="hourly_metrics_dimensions_add_up",
    description=(
        "hourly_metrics:dimensions_add_up for every hour from the first"
        " partition, once a week."
    ),
    automation_condition=_on_cron(FULL_HISTORY_CHECKS_CRON),
)
def hourly_metrics_dimensions_add_up_full_history(
    postgres: PostgresResource,
) -> dg.AssetCheckResult:
    start = dimension_check_start(datetime.now(UTC), full_history=True)
    with postgres.get_connection() as conn:
        rows = find_dimension_mismatches(conn, start)
    return dimension_check_result(rows)


FULL_HISTORY_CHECKS = (
    hourly_metrics_matches_source_tables_full_history,
    hourly_metrics_dimensions_add_up_full_history,
    daily_metrics_sums_match_full_history,
    weekly_metrics_sums_match_full_history,
    monthly_metrics_sums_match_full_history,
    yearly_metrics_sums_match_full_history,
)

METRICS_CHECKS = (
    hourly_metrics_matches_source_tables,
    hourly_metrics_data_is_fresh,
    hourly_metrics_dimensions_add_up,
    daily_metrics_sums_match,
    weekly_metrics_sums_match,
    monthly_metrics_sums_match,
    yearly_metrics_sums_match,
    *FULL_HISTORY_CHECKS,
)

METRICS_CHECK_KEYS = tuple(key for c in METRICS_CHECKS for key in c.check_keys)
FULL_HISTORY_CHECK_KEYS = tuple(
    key for c in FULL_HISTORY_CHECKS for key in c.check_keys
)

FRESHNESS_CHECK_KEY = dg.AssetCheckKey(hourly_metrics.key, "data_is_fresh")
# The checks whose failures are expected while a backfill rewrites the
# metrics level by level: their alerts wait until no backfill is in progress.
CONSISTENCY_CHECK_KEYS = tuple(
    key for key in METRICS_CHECK_KEYS if key != FRESHNESS_CHECK_KEY
)
