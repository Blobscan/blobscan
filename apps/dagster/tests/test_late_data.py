"""Tests for metrics_late_data_sensor.

The SQL runs against the containerized database, after hourly_metrics is
aggregated from the standard fixture data. A test that changes a row does it
in an uncommitted transaction, so the change is rolled back when the
connection closes.
"""

from __future__ import annotations

import json
from datetime import UTC, datetime, timedelta
from pathlib import Path
from unittest.mock import MagicMock, patch

import dagster as dg
import pytest
from sqlalchemy import text

from analytics.defs.assets import hourly_metrics, hourly_partitions
from analytics.defs.jobs import hourly_metrics_job
from analytics.defs.late_data import (
    LATE_DATA_TAG,
    MAX_HOURS_PER_RUN,
    LateHour,
    build_run_request,
    find_late_hours,
    group_late_hours,
    late_data_window,
    metrics_late_data_sensor,
)
from analytics.defs.resources.postgres import PostgresResource

_FIXTURES = json.loads((Path(__file__).parent / "db-fixtures.json").read_text())
_BLOCK_TIMES = [datetime.fromisoformat(b["timestamp"]) for b in _FIXTURES["blocks"]]
_HOURS = sorted(
    {t.replace(minute=0, second=0, microsecond=0, tzinfo=UTC) for t in _BLOCK_TIMES},
)

# The fixture hour with the most transactions
HOUR = datetime(2025, 2, 5, 16, tzinfo=UTC)
NAIVE_HOUR = HOUR.replace(tzinfo=None)
# Covers every fixture hour
WINDOW = (hourly_partitions.start, datetime(2025, 3, 1, tzinfo=UTC))

def _execute(conn, sql: str, **params: object) -> None:
    conn.execute(text(sql), params)


def _delete_hour(conn) -> None:
    _execute(
        conn, "DELETE FROM hourly_metrics WHERE period_start = :ps", ps=NAIVE_HOUR,
    )


def _index_hour_again(conn, *, ago: str) -> None:
    """Set the time when the indexer wrote the transactions of HOUR."""
    _execute(
        conn,
        "UPDATE transaction SET inserted_at = LOCALTIMESTAMP - CAST(:ago AS INTERVAL)"
        " WHERE block_timestamp >= :ps"
        "   AND block_timestamp < :ps + INTERVAL '1 hour'",
        ps=NAIVE_HOUR,
        ago=ago,
    )


def _fork_hour(conn, *, limit: int | None) -> None:
    """Fork transactions of HOUR one hour ago. The fixtures already have forks."""
    _execute(
        conn,
        "INSERT INTO transaction_fork (hash, block_hash, inserted_at, updated_at)"
        " SELECT hash, block_hash, LOCALTIMESTAMP - INTERVAL '1 hour',"
        "   LOCALTIMESTAMP - INTERVAL '1 hour'"
        " FROM transaction"
        " WHERE block_timestamp >= :ps"
        "   AND block_timestamp < :ps + INTERVAL '1 hour'"
        " ORDER BY hash LIMIT :limit"
        " ON CONFLICT (block_hash, hash) DO UPDATE"
        " SET inserted_at = EXCLUDED.inserted_at, updated_at = EXCLUDED.updated_at",
        ps=NAIVE_HOUR,
        limit=limit,
    )


@pytest.fixture(scope="module")
def aggregated(postgres: PostgresResource):
    with postgres.transaction() as conn:
        conn.execute(text("DELETE FROM hourly_metrics"))
        # The fixtures were indexed when the tests started: make them settled
        conn.execute(
            text(
                "UPDATE transaction SET"
                " inserted_at = LOCALTIMESTAMP - INTERVAL '1 day',"
                " updated_at = LOCALTIMESTAMP - INTERVAL '1 day'",
            ),
        )
        conn.execute(
            text(
                "UPDATE transaction_fork SET"
                " inserted_at = LOCALTIMESTAMP - INTERVAL '1 day',"
                " updated_at = LOCALTIMESTAMP - INTERVAL '1 day'",
            ),
        )
    for hour in _HOURS:
        hourly_metrics(
            context=dg.build_asset_context(
                partition_key=hour.strftime("%Y-%m-%dT%H:%M"),
            ),
            postgres=postgres,
        )
    yield
    with postgres.transaction() as conn:
        conn.execute(text("DELETE FROM hourly_metrics"))


@pytest.fixture
def conn(postgres: PostgresResource, aggregated):  # noqa: ARG001
    """Yield a connection whose changes are rolled back."""
    with postgres.get_connection() as connection:
        yield connection


def _aggregated_two_hours_ago(conn) -> None:
    _execute(
        conn,
        "UPDATE hourly_metrics SET updated_at = LOCALTIMESTAMP - INTERVAL '2 hours'"
        " WHERE period_start = :ps",
        ps=NAIVE_HOUR,
    )


def _late_hours(conn) -> list[datetime]:
    return [h.period_start for h in find_late_hours(conn, *WINDOW)]


# ---------------------------------------------------------------------------
# The SQL
# ---------------------------------------------------------------------------


class TestFindLateHours:
    def test_none_after_aggregation(self, conn):
        assert _late_hours(conn) == []

    def test_a_transaction_indexed_after_aggregation(self, conn):
        _aggregated_two_hours_ago(conn)
        _index_hour_again(conn, ago="1 hour")
        [late] = find_late_hours(conn, *WINDOW)
        assert late.period_start == HOUR
        assert late.aggregated_at is not None
        assert late.changed_at > late.aggregated_at

    def test_an_hour_aggregated_while_the_indexer_was_down(self, conn):
        # The hour has no metrics rows: its transactions were indexed later
        _delete_hour(conn)
        [late] = find_late_hours(conn, *WINDOW)
        assert late.period_start == HOUR
        assert late.aggregated_at is None

    def test_waits_until_the_indexer_stops_writing_the_hour(self, conn):
        _aggregated_two_hours_ago(conn)
        _index_hour_again(conn, ago="0 minutes")
        assert _late_hours(conn) == []

    def test_a_fork_indexed_after_aggregation(self, conn):
        _aggregated_two_hours_ago(conn)
        _fork_hour(conn, limit=1)
        assert _late_hours(conn) == [HOUR]

    def test_ignores_an_hour_whose_transactions_are_all_forked(self, conn):
        # Aggregating it again writes no rows, so it would stay late forever
        _fork_hour(conn, limit=None)
        _delete_hour(conn)
        assert _late_hours(conn) == []

    def test_ignores_hours_outside_the_window(self, conn):
        _delete_hour(conn)
        assert find_late_hours(conn, WINDOW[0], HOUR) == []
        assert find_late_hours(conn, HOUR + timedelta(hours=1), WINDOW[1]) == []

    def test_does_not_depend_on_the_session_time_zone(self, conn):
        _delete_hour(conn)
        _execute(conn, "SET LOCAL TIME ZONE 'Etc/GMT-1'")
        [late] = find_late_hours(conn, HOUR, HOUR + timedelta(hours=1))
        assert late.period_start == HOUR


def test_window_ends_before_the_catch_up_hours():
    now = datetime(2025, 2, 5, 20, 20, tzinfo=UTC)
    assert late_data_window(now) == (
        datetime(2025, 1, 6, 17, tzinfo=UTC),
        datetime(2025, 2, 5, 17, tzinfo=UTC),
    )
    start, _ = late_data_window(hourly_partitions.start + timedelta(days=2))
    assert start == hourly_partitions.start


# ---------------------------------------------------------------------------
# The runs
# ---------------------------------------------------------------------------

# The database returns times without a time zone
_CHANGED = datetime(2025, 3, 1, 12, tzinfo=UTC).replace(tzinfo=None)


def _hour(hours: int) -> LateHour:
    return LateHour(
        period_start=HOUR + timedelta(hours=hours),
        changed_at=_CHANGED + timedelta(minutes=hours),
        aggregated_at=None,
    )


class TestGroupLateHours:
    def test_groups_close_hours(self):
        [late_range] = group_late_hours([_hour(5), _hour(0), _hour(24)])
        assert (late_range.first, late_range.last) == (HOUR, HOUR + timedelta(hours=24))
        assert late_range.late_hours == 3
        assert late_range.changed_at == _CHANGED + timedelta(minutes=24)

    def test_splits_hours_far_apart(self):
        ranges = group_late_hours([_hour(0), _hour(25)])
        assert [(r.first_key, r.last_key) for r in ranges] == [
            ("2025-02-05T16:00", "2025-02-05T16:00"),
            ("2025-02-06T17:00", "2025-02-06T17:00"),
        ]

    def test_splits_long_outages_into_weeks(self):
        ranges = group_late_hours([_hour(h) for h in range(400)])
        assert [r.late_hours for r in ranges] == [168, 168, 64]
        for r in ranges:
            assert r.last - r.first < MAX_HOURS_PER_RUN * timedelta(hours=1)

    def test_a_new_change_gives_a_new_run_key(self):
        [before] = group_late_hours([_hour(0)])
        [after] = group_late_hours(
            [LateHour(HOUR, _CHANGED + timedelta(hours=1), None)],
        )
        assert before.run_key != after.run_key


def test_run_request_aggregates_the_range():
    [late_range] = group_late_hours([_hour(0), _hour(2)])
    request = build_run_request(late_range)
    assert request.tags == {
        "dagster/asset_partition_range_start": "2025-02-05T16:00",
        "dagster/asset_partition_range_end": "2025-02-05T18:00",
        LATE_DATA_TAG: "true",
    }


def test_the_job_runs_a_range(postgres: PostgresResource, aggregated):  # noqa: ARG001
    with postgres.transaction() as conn:
        _delete_hour(conn)
    [late_range] = group_late_hours([_hour(-1), _hour(0)])
    job = dg.Definitions(
        assets=[hourly_metrics],
        jobs=[hourly_metrics_job],
        resources={"postgres": postgres},
    ).resolve_job_def(hourly_metrics_job.name)
    result = job.execute_in_process(tags=build_run_request(late_range).tags)
    assert result.success
    with postgres.get_connection() as conn:
        assert find_late_hours(conn, *WINDOW) == []


# ---------------------------------------------------------------------------
# The sensor
# ---------------------------------------------------------------------------


class TestSensor:
    def _evaluate(self, late: list[LateHour], cursor: str | None):
        context = dg.build_sensor_context(
            cursor=cursor, resources={"postgres": MagicMock()},
        )
        with (
            patch("analytics.defs.late_data.find_late_hours", return_value=late),
            patch("analytics.defs.late_data.send_alert") as alert,
        ):
            result = metrics_late_data_sensor(context)
        return result, [c.args[0] for c in alert.call_args_list], context.cursor

    def test_is_stopped_by_default(self):
        assert metrics_late_data_sensor.default_status == dg.DefaultSensorStatus.STOPPED

    def test_requests_a_run_and_alerts_once(self):
        result, alerts, cursor = self._evaluate([_hour(0), _hour(1)], None)
        [request] = result
        assert request.run_key.startswith(
            "late-data:2025-02-05T16:00..2025-02-05T17:00@",
        )
        assert len(alerts) == 1
        assert "2 hour(s)" in alerts[0]

        # Until the run aggregates the hours: the same request, no new alert
        result, alerts, cursor = self._evaluate([_hour(0), _hour(1)], cursor)
        assert [r.run_key for r in result] == [request.run_key]
        assert alerts == []

        result, alerts, cursor = self._evaluate([], cursor)
        assert isinstance(result, dg.SkipReason)
        assert alerts == []
        assert json.loads(cursor) == []

    def test_no_run_without_late_hours(self):
        result, alerts, _ = self._evaluate([], None)
        assert isinstance(result, dg.SkipReason)
        assert alerts == []
