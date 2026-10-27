"""Unit tests for the metrics schedules.

The hourly catch-up schedule fires at :05 past each hour and re-aggregates the last
CATCH_UP_HOURS completed hours to capture data that arrived after the live
schedule's last tick before the hour rolled over, and late-recorded reorgs.
"""

from datetime import UTC, datetime, timedelta

import dagster as dg

from analytics.defs.assets import hourly_partitions
from analytics.defs.schedules import (
    CATCH_UP_HOURS,
    all_time_metrics_schedule,
    hourly_catch_up_schedule,
    live_hourly_schedule,
)

# Every 7 hours over ~5 weeks (every weekday at varying hours, plus the
# Mar → Apr boundary), and the edges of a year boundary. Must start after
# DAGSTER_METRICS_START_DATE (see conftest.py) so the partitions exist.
_SAMPLE_TIMES = [
    datetime(2024, 3, 20, tzinfo=UTC) + timedelta(hours=7 * i) for i in range(120)
] + [
    datetime(2024, 12, 31, 23, 59, tzinfo=UTC),
    datetime(2025, 1, 1, 0, 0, tzinfo=UTC),
]


def _run_live(schedule: dg.ScheduleDefinition, at: datetime) -> dg.RunRequest:
    # Call the schedule function directly: evaluate_tick needs a repository_def
    # to resolve partitioned run requests.
    context = dg.build_schedule_context(scheduled_execution_time=at)
    return schedule(context)


class TestLiveHourlySchedule:
    def test_requested_partition_exists_and_contains_tick_time(self):
        # Checks against the partition definitions rather than hard-coded keys,
        # so a mismatch between schedule and partitions can't be locked in.
        for at in _SAMPLE_TIMES:
            key = _run_live(live_hourly_schedule, at).partition_key
            with dg.partition_loading_context(effective_dt=at):
                assert hourly_partitions.has_partition_key(key), (at, key)
            window = hourly_partitions.time_window_for_partition_key(key)
            assert window.start <= at < window.end, (at, key)

    def test_hourly_key_format(self):
        at = datetime(2024, 3, 15, 14, 37, 12, tzinfo=UTC)
        assert _run_live(live_hourly_schedule, at).partition_key == "2024-03-15T14:00"


class TestHourlyCatchUpSchedule:
    def _run(self, execution_time: datetime) -> list[dg.RunRequest]:
        context = dg.build_schedule_context(scheduled_execution_time=execution_time)
        return list(hourly_catch_up_schedule(context))

    def _keys(self, execution_time: datetime) -> list[str]:
        return [r.partition_key for r in self._run(execution_time)]

    def test_returns_last_completed_hours(self):
        # Fires at 15:05 → should re-aggregate 14:00, 13:00 and 12:00
        assert self._keys(datetime(2024, 3, 15, 15, 5, tzinfo=UTC)) == [
            "2024-03-15T14:00",
            "2024-03-15T13:00",
            "2024-03-15T12:00",
        ]

    def test_requests_catch_up_hours_partitions(self):
        assert len(self._run(datetime(2024, 3, 15, 15, 5, tzinfo=UTC))) == (
            CATCH_UP_HOURS
        )

    def test_crosses_midnight_boundary(self):
        # Fires at 00:05 → should re-aggregate the previous day's last hours
        assert self._keys(datetime(2024, 3, 15, 0, 5, tzinfo=UTC)) == [
            "2024-03-14T23:00",
            "2024-03-14T22:00",
            "2024-03-14T21:00",
        ]

    def test_crosses_month_boundary(self):
        # Fires at 00:05 on April 1 → March 31. Must be after the partitions
        # start date (see conftest.py), or the keys are skipped.
        keys = self._keys(datetime(2024, 4, 1, 0, 5, tzinfo=UTC))
        assert keys[0] == "2024-03-31T23:00"

    def test_minutes_and_seconds_are_zeroed(self):
        # Even if the schedule fires late, the partition key must be zero-padded
        keys = self._keys(datetime(2024, 6, 15, 10, 59, 59, tzinfo=UTC))
        assert keys[0] == "2024-06-15T09:00"

    def test_skips_hours_before_partitions_start(self):
        # conftest.py sets the start date to 2024-03-13T13:55, so the first
        # hourly partition is 13:00. At 15:05, 12:00 is not in the set.
        assert self._keys(datetime(2024, 3, 13, 15, 5, tzinfo=UTC)) == [
            "2024-03-13T14:00",
            "2024-03-13T13:00",
        ]

    def test_run_keys_are_unique(self):
        requests = self._run(datetime(2024, 3, 15, 15, 5, tzinfo=UTC))
        run_keys = [r.run_key for r in requests]
        assert all(run_keys)
        assert len(set(run_keys)) == len(run_keys)


class TestAllTimeMetricsSchedule:
    def test_runs_every_10_minutes_after_the_cascade(self):
        assert all_time_metrics_schedule.cron_schedule == "5-59/10 * * * *"

    def test_is_running_by_default(self):
        # all_time_metrics had no schedule to enable before, so it must not
        # stop after a deploy.
        assert (
            all_time_metrics_schedule.default_status
            == dg.DefaultScheduleStatus.RUNNING
        )
