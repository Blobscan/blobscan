"""Checks that the aggregation SQL files list all the metric columns.

When you add a metric column, you must add it to many places in the SQL files.
Some mistakes do not cause a SQL error. For example, if a column is not in
ON CONFLICT, a backfill does not update the old values. These tests compare
the SQL files with the columns of the metrics tables in the database.
"""

import re

import pytest
from sqlalchemy import text

from analytics.defs.helpers import SQL_DIR
from analytics.defs.resources.postgres import PostgresResource

# The database writes the id. aggregate_all_time.sql writes updated_at with
# now(), so it stays in the expected columns.
_NOT_WRITTEN_COLUMNS = {"id"}
# The ON CONFLICT target columns. all_time_metrics has no period_start.
_KEY_COLUMNS = {"period_start", "category", "rollup"}

_HOURLY_SQL_FILES = [
    "aggregate_tx_hourly.sql",
    "aggregate_blob_hourly.sql",
    "aggregate_eth_price_hourly.sql",
]
_ALL_SQL_FILES = [*_HOURLY_SQL_FILES, "aggregate.sql", "aggregate_all_time.sql"]
_AGGREGATE_TARGET_TABLES = [
    "daily_metrics",
    "weekly_metrics",
    "monthly_metrics",
    "yearly_metrics",
]


def _read_sql(name: str) -> str:
    sql = (SQL_DIR / name).read_text()
    return re.sub(r"--[^\n]*", "", sql)


def _split_top_level(expressions: str) -> list[str]:
    """Split a comma-separated list, but not at the commas inside brackets."""
    parts: list[str] = []
    depth = 0
    current = ""
    for char in expressions:
        if char == "," and depth == 0:
            parts.append(current)
            current = ""
            continue
        depth += {"(": 1, ")": -1}.get(char, 0)
        current += char
    parts.append(current)
    return [p.strip() for p in parts if p.strip()]


def _output_names(select_list: str) -> list[str]:
    """Return the output column name of each expression in a SELECT list.

    The name is the last identifier: the alias, or the column of "t.column".
    An expression without an alias, for example "now()", has no name (None).
    """
    names: list[str | None] = []
    for expression in _split_top_level(select_list):
        match = re.search(r"(\w+)$", expression)
        names.append(match.group(1) if match else None)
    return names


def _insert_columns(sql: str) -> list[str]:
    match = re.search(r"INSERT INTO \S+ \((.*?)\)\s*SELECT", sql, re.DOTALL)
    assert match, "No INSERT INTO ... SELECT statement"
    return _split_top_level(match.group(1))


def _insert_select_names(sql: str) -> list[str]:
    match = re.search(
        r"INSERT INTO .*?\)\s*SELECT(.*?)\bFROM\b",
        sql,
        re.DOTALL,
    )
    assert match, "No INSERT INTO ... SELECT ... FROM statement"
    return _output_names(match.group(1))


def _updated_columns(sql: str) -> list[str]:
    _, _, update_set = sql.partition("DO UPDATE SET")
    pairs = re.findall(r"(\w+)\s*=\s*(?:EXCLUDED\.(\w+))?", update_set)
    for column, excluded_column in pairs:
        if excluded_column:
            assert column == excluded_column, f"{column} = EXCLUDED.{excluded_column}"
    return [column for column, _ in pairs]


def _table_columns(postgres: PostgresResource, table: str) -> set[str]:
    with postgres.get_connection() as conn:
        rows = conn.execute(
            text(
                """
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name = :table AND is_generated = 'NEVER'
                """,
            ),
            {"table": table},
        ).scalars()
        return set(rows) - _NOT_WRITTEN_COLUMNS


@pytest.mark.integration
@pytest.mark.parametrize("name", _ALL_SQL_FILES)
def test_select_order_matches_insert_columns(name):
    # INSERT matches the SELECT values to the columns by position.
    sql = _read_sql(name)
    columns = _insert_columns(sql)
    names = _insert_select_names(sql)
    assert len(names) == len(columns)
    for column, select_name in zip(columns, names, strict=True):
        assert select_name in (column, None), f"{select_name} goes into {column}"


@pytest.mark.integration
@pytest.mark.parametrize("name", _ALL_SQL_FILES)
def test_on_conflict_updates_all_inserted_columns(name):
    sql = _read_sql(name)
    inserted = set(_insert_columns(sql)) - _KEY_COLUMNS
    assert sorted(_updated_columns(sql)) == sorted(inserted)


@pytest.mark.integration
def test_hourly_sql_files_write_all_hourly_columns(postgres):
    written: set[str] = set()
    for name in _HOURLY_SQL_FILES:
        written |= set(_insert_columns(_read_sql(name)))
    assert written == _table_columns(postgres, "hourly_metrics")


@pytest.mark.integration
@pytest.mark.parametrize("table", ["hourly_metrics", *_AGGREGATE_TARGET_TABLES])
def test_aggregate_sql_covers_table_columns(postgres, table):
    # aggregate.sql reads from one of these tables and writes to the next one.
    columns = set(_insert_columns(_read_sql("aggregate.sql")))
    assert columns == _table_columns(postgres, table)


@pytest.mark.integration
def test_all_time_sql_covers_table_columns(postgres):
    sql = _read_sql("aggregate_all_time.sql")
    expected = _table_columns(postgres, "all_time_metrics")
    assert set(_insert_columns(sql)) == expected

    # The CTEs carry the metrics. The INSERT adds updated_at.
    metrics = expected - {"updated_at"}
    unioned = re.search(r"unioned AS \((.*?)\),\s*aggregated AS", sql, re.DOTALL)
    assert unioned, "No unioned CTE"
    arms = [
        _output_names(re.search(r"SELECT(.*?)\bFROM\b", arm, re.DOTALL).group(1))
        for arm in unioned.group(1).split("UNION ALL")
    ]
    # UNION ALL matches the columns of the arms by position.
    for arm in arms[1:]:
        assert arm == arms[0]
    assert set(arms[0]) == metrics

    aggregated = re.search(r"aggregated AS \(\s*SELECT(.*?)\bFROM\b", sql, re.DOTALL)
    assert aggregated, "No aggregated CTE"
    assert set(_output_names(aggregated.group(1))) == metrics
