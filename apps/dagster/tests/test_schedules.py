"""Unit tests for the hourly catch-up schedule.

The schedule fires at :05 past each hour and re-aggregates the last
CATCH_UP_HOURS completed hours to capture data that arrived after the live
sensor's last tick before the hour rolled over, and late-recorded reorgs.
"""

from datetime import UTC, datetime

import dagster as dg

from analytics.defs.schedules import CATCH_UP_HOURS, hourly_catch_up_schedule


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
        # Fires at 00:05 on March 1 → Feb 29 (2024 is a leap year)
        keys = self._keys(datetime(2024, 3, 1, 0, 5, tzinfo=UTC))
        assert keys[0] == "2024-02-29T23:00"

    def test_minutes_and_seconds_are_zeroed(self):
        # Even if the schedule fires late, the partition key must be zero-padded
        keys = self._keys(datetime(2024, 6, 15, 10, 59, 59, tzinfo=UTC))
        assert keys[0] == "2024-06-15T09:00"

    def test_run_keys_are_unique(self):
        requests = self._run(datetime(2024, 3, 15, 15, 5, tzinfo=UTC))
        run_keys = [r.run_key for r in requests]
        assert all(run_keys)
        assert len(set(run_keys)) == len(run_keys)
