"""Tests for the asset checks of the network metrics.

The SQL of each check runs against the containerized database, after the
metrics are aggregated from the standard fixture data. A test that changes a
metrics row does it in an uncommitted transaction, so the change is rolled back
when the connection closes.
"""

from __future__ import annotations

import json
from datetime import UTC, datetime, timedelta
from pathlib import Path
from unittest.mock import patch

import dagster as dg
import pytest
from sqlalchemy import text

from analytics.defs.alerts import metrics_check_alert
from analytics.defs.assets import (
    all_time_metrics,
    daily_metrics,
    hourly_metrics,
    hourly_partitions,
    monthly_metrics,
    weekly_metrics,
    yearly_metrics,
)
from analytics.defs.checks import (
    CONSISTENCY_CHECK_KEYS,
    DEFAULT_MAX_LAG_MINUTES,
    FRESHNESS_CHECK_KEY,
    MAX_LAG_ENV_VAR,
    METRICS_CHECK_KEYS,
    METRICS_CHECKS,
    build_rollup_check_sql,
    closed_until,
    dimension_check_result,
    evaluate_freshness_check,
    evaluate_source_check,
    find_dimension_mismatches,
    find_rollup_mismatches,
    find_source_mismatches,
    max_data_lag,
    rollup_check_result,
    source_check_window,
)
from analytics.defs.helpers import start_of_week
from analytics.defs.jobs import (
    daily_metrics_job,
    hourly_metrics_job,
    monthly_metrics_job,
    weekly_metrics_job,
    yearly_metrics_job,
)
from analytics.defs.resources.postgres import PostgresResource

_FIXTURES = json.loads((Path(__file__).parent / "db-fixtures.json").read_text())
_BLOCK_TIMES = [datetime.fromisoformat(b["timestamp"]) for b in _FIXTURES["blocks"]]

# The fixture hour with transactions of both categories and of several rollups
HOUR = datetime(2025, 2, 5, 16, tzinfo=UTC)
NAIVE_HOUR = HOUR.replace(tzinfo=None)


def _utc(*args: int) -> datetime:
    return datetime(*args, tzinfo=UTC)


def _naive(*args: int) -> datetime:
    """Return a UTC time as the database returns it (no time zone)."""
    return datetime(*args, tzinfo=UTC).replace(tzinfo=None)

# Covers every fixture hour from the partitions start (see conftest.py)
SOURCE_WINDOW = (datetime(2024, 3, 13, tzinfo=UTC), datetime(2025, 3, 1, tzinfo=UTC))
FAR_FUTURE = datetime(2030, 1, 1, tzinfo=UTC)

ROLLUP_LEVELS = [
    ("hourly_metrics", "daily_metrics", "day"),
    ("daily_metrics", "weekly_metrics", "week"),
    ("daily_metrics", "monthly_metrics", "month"),
    ("monthly_metrics", "yearly_metrics", "year"),
]

_PARTITION_KEYS = [
    (hourly_metrics, lambda ts: ts.strftime("%Y-%m-%dT%H:00")),
    (daily_metrics, lambda ts: ts.strftime("%Y-%m-%d")),
    (weekly_metrics, lambda ts: start_of_week(ts).strftime("%Y-%m-%d")),
    (monthly_metrics, lambda ts: ts.strftime("%Y-%m")),
    (yearly_metrics, lambda ts: ts.strftime("%Y")),
]

_METRICS_TABLES = [
    "hourly_metrics",
    "daily_metrics",
    "weekly_metrics",
    "monthly_metrics",
    "yearly_metrics",
]


def _delete_metrics(postgres: PostgresResource) -> None:
    with postgres.transaction() as conn:
        for table in _METRICS_TABLES:
            conn.execute(text(f"DELETE FROM {table}"))  # noqa: S608


@pytest.fixture(scope="module")
def aggregated(postgres: PostgresResource):
    """Aggregate every level for the partitions of the fixture data."""
    _delete_metrics(postgres)
    for asset, key_of in _PARTITION_KEYS:
        for key in sorted({key_of(ts) for ts in _BLOCK_TIMES}):
            asset(context=dg.build_asset_context(partition_key=key), postgres=postgres)
    yield
    _delete_metrics(postgres)


@pytest.fixture
def conn(postgres: PostgresResource, aggregated):  # noqa: ARG001
    """Yield a connection whose changes are rolled back."""
    with postgres.get_connection() as connection:
        yield connection


def _execute(conn, sql: str, **params: object) -> None:
    conn.execute(text(sql), params)


# ---------------------------------------------------------------------------
# The source check of hourly_metrics
# ---------------------------------------------------------------------------


class TestSourceCheck:
    def test_matches_after_aggregation(self, conn):
        assert find_source_mismatches(conn, *SOURCE_WINDOW) == []

    def test_reports_a_changed_count(self, conn):
        _execute(
            conn,
            "UPDATE hourly_metrics SET total_transactions = total_transactions + 1"
            " WHERE period_start = :ps AND category IS NULL AND rollup IS NULL",
            ps=HOUR,
        )
        [row] = find_source_mismatches(conn, *SOURCE_WINDOW)
        assert row["period_start"] == NAIVE_HOUR
        assert row["metrics_transactions"] == row["source_transactions"] + 1
        assert row["metrics_blobs"] == row["source_blobs"]

    def test_reports_a_missing_hour(self, conn):
        _execute(
            conn,
            "DELETE FROM hourly_metrics"
            " WHERE period_start = :ps AND category IS NULL AND rollup IS NULL",
            ps=HOUR,
        )
        [row] = find_source_mismatches(conn, *SOURCE_WINDOW)
        assert row["metrics_transactions"] == 0
        assert row["source_transactions"] > 0
        assert row["source_blobs"] > 0

    def test_ignores_hours_outside_the_window(self, conn):
        _execute(
            conn,
            "UPDATE hourly_metrics SET total_blobs = total_blobs + 1"
            " WHERE period_start = :ps AND category IS NULL AND rollup IS NULL",
            ps=HOUR,
        )
        assert find_source_mismatches(conn, SOURCE_WINDOW[0], HOUR) == []

    def test_window_ends_before_the_catch_up_hours(self):
        now = datetime(2025, 2, 5, 20, 20, tzinfo=UTC)
        assert source_check_window(now) == (
            datetime(2025, 2, 3, 17, tzinfo=UTC),
            datetime(2025, 2, 5, 17, tzinfo=UTC),
        )

    def test_window_starts_no_earlier_than_the_partitions(self):
        now = hourly_partitions.start + timedelta(hours=10)
        start, _ = source_check_window(now)
        assert start == hourly_partitions.start

    def test_result(self, conn):
        # The window of this time covers HOUR only
        now = HOUR + timedelta(hours=4, minutes=20)
        assert evaluate_source_check(conn, now).passed

        _execute(
            conn,
            "UPDATE hourly_metrics SET total_blocks = total_blocks + 1"
            " WHERE period_start = :ps AND category IS NULL AND rollup IS NULL",
            ps=HOUR,
        )
        result = evaluate_source_check(conn, now)
        assert not result.passed
        assert result.severity == dg.AssetCheckSeverity.WARN
        assert result.metadata["mismatches"].value == 1
        assert "2025-02-05T16:00" in (result.description or "")

    def test_passes_when_no_hour_is_closed_yet(self, conn):
        result = evaluate_source_check(conn, hourly_partitions.start)
        assert result.passed


# ---------------------------------------------------------------------------
# The rollup checks
# ---------------------------------------------------------------------------


class TestRollupChecks:
    @pytest.mark.parametrize(("source", "target", "trunc"), ROLLUP_LEVELS)
    def test_sums_match_after_aggregation(self, conn, source, target, trunc):
        sql = build_rollup_check_sql(source, target, trunc)
        assert find_rollup_mismatches(conn, sql, FAR_FUTURE) == []

    def _daily_mismatches(self, conn, until: datetime = FAR_FUTURE):
        sql = build_rollup_check_sql("hourly_metrics", "daily_metrics", "day")
        return find_rollup_mismatches(conn, sql, until)

    def test_reports_a_changed_row(self, conn):
        _execute(
            conn,
            "UPDATE daily_metrics SET total_blobs = total_blobs + 1"
            " WHERE period_start = :ps AND category IS NULL AND rollup IS NULL",
            ps=datetime(2025, 2, 5, tzinfo=UTC),
        )
        assert self._daily_mismatches(conn) == [
            {
                "period_start": _naive(2025, 2, 5),
                "category": None,
                "rollup": None,
                "problem": "differs",
                "columns": ["total_blobs"],
            },
        ]

    def test_reports_a_missing_row(self, conn):
        _execute(
            conn,
            "DELETE FROM daily_metrics"
            " WHERE period_start = :ps AND category = 'rollup' AND rollup IS NULL",
            ps=datetime(2025, 2, 5, tzinfo=UTC),
        )
        [row] = self._daily_mismatches(conn)
        assert (row["category"], row["rollup"], row["problem"]) == (
            "rollup", None, "missing",
        )

    def test_reports_a_row_in_the_wrong_period(self, conn):
        sql = build_rollup_check_sql("daily_metrics", "weekly_metrics", "week")
        _execute(
            conn,
            "UPDATE weekly_metrics SET period_start = '2024-06-03'"
            " WHERE period_start = :ps AND category IS NULL AND rollup IS NULL",
            ps=datetime(2025, 2, 3, tzinfo=UTC),
        )
        rows = find_rollup_mismatches(conn, sql, FAR_FUTURE)
        assert {(r["period_start"], r["problem"]) for r in rows} == {
            (_naive(2024, 6, 3), "extra"),
            (_naive(2025, 2, 3), "missing"),
        }

    def test_ignores_periods_that_are_not_closed(self, conn):
        _execute(
            conn,
            "UPDATE daily_metrics SET total_blobs = total_blobs + 1"
            " WHERE period_start = :ps AND category IS NULL AND rollup IS NULL",
            ps=datetime(2025, 2, 5, tzinfo=UTC),
        )
        until = closed_until("day", datetime(2025, 2, 5, 12, tzinfo=UTC))
        assert self._daily_mismatches(conn, until) == []

    def test_result(self):
        rows = [
            {
                "period_start": _naive(2025, 2, 5),
                "category": "rollup",
                "rollup": None,
                "problem": "differs",
                "columns": ["total_blobs", "total_blob_size"],
            },
        ]
        result = rollup_check_result(
            "daily_metrics", "hourly_metrics", rows, FAR_FUTURE,
        )
        assert not result.passed
        assert result.severity == dg.AssetCheckSeverity.WARN
        assert "2025-02-05T00:00 rollup: total_blobs, total_blob_size" in (
            result.description or ""
        )
        assert rollup_check_result(
            "daily_metrics", "hourly_metrics", [], FAR_FUTURE,
        ).passed


@pytest.mark.parametrize(
    ("trunc", "now", "expected"),
    [
        # Less than ROLLUP_CHECK_GRACE after midnight: yesterday is not checked
        ("day", _utc(2025, 2, 5, 0, 30), _utc(2025, 2, 4)),
        ("day", _utc(2025, 2, 5, 1, 30), _utc(2025, 2, 5)),
        # 2025-02-05 is a Wednesday
        ("week", _utc(2025, 2, 5, 12), _utc(2025, 2, 3)),
        ("month", _utc(2025, 2, 5, 12), _utc(2025, 2, 1)),
        ("month", _utc(2025, 2, 1, 0, 30), _utc(2025, 1, 1)),
        ("year", _utc(2025, 2, 5, 12), _utc(2025, 1, 1)),
    ],
)
def test_closed_until(trunc, now, expected):
    assert closed_until(trunc, now) == expected


# ---------------------------------------------------------------------------
# The dimension check of hourly_metrics
# ---------------------------------------------------------------------------


class TestDimensionCheck:
    def test_adds_up_after_aggregation(self, conn):
        assert find_dimension_mismatches(conn) == []

    def test_reports_a_changed_category_row(self, conn):
        _execute(
            conn,
            "UPDATE hourly_metrics SET total_transactions = total_transactions + 1"
            " WHERE period_start = :ps AND category = 'other' AND rollup IS NULL",
            ps=HOUR,
        )
        assert find_dimension_mismatches(conn) == [
            {
                "period_start": NAIVE_HOUR,
                "comparison": "categories add up to the global row",
                "columns": ["total_transactions"],
            },
        ]

    def test_reports_a_changed_rollup_row(self, conn):
        _execute(
            conn,
            "UPDATE hourly_metrics SET total_blobs = total_blobs + 1"
            " WHERE period_start = :ps AND rollup IS NOT NULL",
            ps=HOUR,
        )
        assert find_dimension_mismatches(conn) == [
            {
                "period_start": NAIVE_HOUR,
                "comparison": "rollups add up to the rollup category row",
                "columns": ["total_blobs"],
            },
        ]

    def test_reports_a_missing_global_row(self, conn):
        _execute(
            conn,
            "DELETE FROM hourly_metrics"
            " WHERE period_start = :ps AND category IS NULL AND rollup IS NULL",
            ps=HOUR,
        )
        [row] = find_dimension_mismatches(conn)
        assert row["comparison"] == "categories add up to the global row"
        assert "total_transactions" in row["columns"]

    def test_result(self):
        result = dimension_check_result(
            [
                {
                    "period_start": NAIVE_HOUR,
                    "comparison": "categories add up to the global row",
                    "columns": ["total_transactions"],
                },
            ],
        )
        assert not result.passed
        assert "total_transactions" in (result.description or "")
        assert dimension_check_result([]).passed


# ---------------------------------------------------------------------------
# The freshness check of hourly_metrics
# ---------------------------------------------------------------------------


class TestFreshnessCheck:
    MAX_LAG = timedelta(minutes=60)

    def _newest_block(self, conn) -> datetime:
        newest = conn.execute(
            text(
                "SELECT MAX(last_block_timestamp) FROM hourly_metrics"
                " WHERE category IS NULL AND rollup IS NULL",
            ),
        ).scalar_one()
        return newest.replace(tzinfo=UTC)

    def test_passes_when_recent(self, conn):
        now = self._newest_block(conn) + timedelta(minutes=10)
        result = evaluate_freshness_check(conn, now, self.MAX_LAG)
        assert result.passed
        assert result.metadata["newest_aggregated_block"].value.startswith(
            "2025-02-05T16:",
        )

    def test_fails_when_the_indexer_has_stopped(self, conn):
        now = self._newest_block(conn) + timedelta(hours=2)
        result = evaluate_freshness_check(conn, now, self.MAX_LAG)
        assert not result.passed
        assert result.severity == dg.AssetCheckSeverity.ERROR
        assert "indexer has stopped" in (result.description or "")

    def test_fails_when_the_pipeline_is_behind(self, conn):
        now = self._newest_block(conn) + timedelta(minutes=10)
        _execute(
            conn,
            "DELETE FROM hourly_metrics"
            " WHERE period_start = :ps AND category IS NULL AND rollup IS NULL",
            ps=HOUR,
        )
        result = evaluate_freshness_check(conn, now, self.MAX_LAG)
        assert not result.passed
        assert "metrics pipeline is behind" in (result.description or "")


class TestMaxDataLag:
    def test_default(self, monkeypatch: pytest.MonkeyPatch):
        monkeypatch.delenv(MAX_LAG_ENV_VAR, raising=False)
        assert max_data_lag() == timedelta(minutes=DEFAULT_MAX_LAG_MINUTES)

    def test_from_env(self, monkeypatch: pytest.MonkeyPatch):
        monkeypatch.setenv(MAX_LAG_ENV_VAR, "180")
        assert max_data_lag() == timedelta(minutes=180)

    @pytest.mark.parametrize("value", ["0", "-5", "1h"])
    def test_rejects_invalid_values(self, monkeypatch: pytest.MonkeyPatch, value):
        monkeypatch.setenv(MAX_LAG_ENV_VAR, value)
        with pytest.raises(ValueError, match=MAX_LAG_ENV_VAR):
            max_data_lag()


# ---------------------------------------------------------------------------
# How the checks are run
# ---------------------------------------------------------------------------

_DEFS = dg.Definitions(
    assets=[
        hourly_metrics,
        daily_metrics,
        weekly_metrics,
        monthly_metrics,
        yearly_metrics,
        all_time_metrics,
    ],
    asset_checks=list(METRICS_CHECKS),
    jobs=[
        hourly_metrics_job,
        daily_metrics_job,
        weekly_metrics_job,
        monthly_metrics_job,
        yearly_metrics_job,
    ],
    resources={"postgres": dg.ResourceDefinition.none_resource()},
)


@pytest.mark.parametrize(
    "job",
    [
        hourly_metrics_job,
        daily_metrics_job,
        weekly_metrics_job,
        monthly_metrics_job,
        yearly_metrics_job,
    ],
    ids=lambda job: job.name,
)
def test_scheduled_jobs_do_not_run_the_checks(job):
    # Without without_checks(), the live schedule would run every check of
    # hourly_metrics every 10 minutes.
    nodes = {node.name for node in _DEFS.resolve_job_def(job.name).graph.nodes}
    assert nodes == {job.name.removesuffix("_job")}


class TestCheckAutomation:
    def _requested_checks(
        self, instance: dg.DagsterInstance, times: list[datetime],
    ) -> list[set[dg.AssetCheckKey]]:
        cursor = None
        requested = []
        for at in times:
            result = dg.evaluate_automation_conditions(
                defs=_DEFS, instance=instance, evaluation_time=at, cursor=cursor,
            )
            cursor = result.cursor
            requested.append(
                {
                    r.key
                    for r in result.results
                    if isinstance(r.key, dg.AssetCheckKey) and r.true_subset.size
                },
            )
        return requested

    def test_every_check_has_a_cron_condition(self):
        for check_def in METRICS_CHECKS:
            [spec] = check_def.check_specs
            assert spec.automation_condition is not None, spec.key

    def test_checks_run_at_their_cron_ticks(self):
        instance = dg.DagsterInstance.ephemeral()
        day = datetime(2024, 3, 20, tzinfo=UTC)
        requested = self._requested_checks(
            instance,
            [
                day.replace(hour=14, minute=18),  # first evaluation: no tick
                day.replace(hour=14, minute=21),  # the :20 tick
                day.replace(hour=14, minute=28),  # the :27 tick
                day.replace(hour=14, minute=29),  # no tick
            ],
        )
        assert requested == [
            set(),
            set(CONSISTENCY_CHECK_KEYS),
            {FRESHNESS_CHECK_KEY},
            set(),
        ]


# ---------------------------------------------------------------------------
# metrics_check_alert
# ---------------------------------------------------------------------------


class TestMetricsCheckAlert:
    SOURCE_KEY = dg.AssetCheckKey(hourly_metrics.key, "matches_source_tables")

    def _report(
        self, instance: dg.DagsterInstance, key: dg.AssetCheckKey, *, passed: bool,
    ) -> None:
        instance.report_runless_asset_event(
            dg.AssetCheckEvaluation(
                asset_key=key.asset_key,
                check_name=key.name,
                passed=passed,
                description=None if passed else "2 hour(s) differ",
            ),
        )

    def _evaluate(
        self,
        instance: dg.DagsterInstance,
        cursor: str | None,
        *,
        backfill: bool = False,
    ) -> tuple[list[str], str | None]:
        context = dg.build_sensor_context(instance=instance, cursor=cursor)
        with (
            patch("analytics.defs.alerts.send_alert") as alert,
            patch(
                "analytics.defs.alerts.backfill_in_progress", return_value=backfill,
            ),
        ):
            metrics_check_alert(context)
        return [c.args[0] for c in alert.call_args_list], context.cursor

    def test_is_stopped_by_default(self):
        assert metrics_check_alert.default_status == dg.DefaultSensorStatus.STOPPED

    def test_watches_every_metrics_check(self):
        assert len(METRICS_CHECK_KEYS) == len(METRICS_CHECKS)
        assert FRESHNESS_CHECK_KEY in METRICS_CHECK_KEYS
        assert FRESHNESS_CHECK_KEY not in CONSISTENCY_CHECK_KEYS

    def test_no_alert_without_evaluations(self):
        messages, _ = self._evaluate(dg.DagsterInstance.ephemeral(), None)
        assert messages == []

    def test_alerts_once_per_failure_and_on_recovery(self):
        instance = dg.DagsterInstance.ephemeral()
        self._report(instance, self.SOURCE_KEY, passed=False)

        messages, cursor = self._evaluate(instance, None)
        assert len(messages) == 1
        assert "hourly_metrics:matches_source_tables" in messages[0]
        assert "2 hour(s) differ" in messages[0]

        messages, cursor = self._evaluate(instance, cursor)
        assert messages == []

        self._report(instance, self.SOURCE_KEY, passed=True)
        messages, cursor = self._evaluate(instance, cursor)
        assert len(messages) == 1
        assert "passes again" in messages[0]

        messages, _ = self._evaluate(instance, cursor)
        assert messages == []

    def test_no_alert_for_a_passing_check(self):
        instance = dg.DagsterInstance.ephemeral()
        self._report(instance, self.SOURCE_KEY, passed=True)
        messages, _ = self._evaluate(instance, None)
        assert messages == []

    def test_defers_consistency_failures_during_a_backfill(self):
        instance = dg.DagsterInstance.ephemeral()
        self._report(instance, self.SOURCE_KEY, passed=False)
        self._report(instance, FRESHNESS_CHECK_KEY, passed=False)

        messages, cursor = self._evaluate(instance, None, backfill=True)
        assert len(messages) == 1
        assert FRESHNESS_CHECK_KEY.to_user_string() in messages[0]

        # Reported after the backfill, as it still fails
        messages, _ = self._evaluate(instance, cursor, backfill=False)
        assert len(messages) == 1
        assert self.SOURCE_KEY.to_user_string() in messages[0]
