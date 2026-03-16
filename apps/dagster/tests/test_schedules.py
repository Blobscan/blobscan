"""
Unit tests for the hourly catch-up schedule.

The schedule fires at :05 past each hour and re-aggregates the *previous* hour
to capture data that arrived after the live sensor's last tick before the hour
rolled over.
"""

from datetime import UTC, datetime
from typing import cast

import dagster as dg

from analytics.defs.schedules import hourly_catch_up_schedule


class TestHourlyCatchUpSchedule:
    def _run(self, execution_time: datetime) -> dg.RunRequest:
        context = dg.build_schedule_context(scheduled_execution_time=execution_time)
        return cast(dg.RunRequest, hourly_catch_up_schedule(context))

    def test_returns_previous_hour_partition_key(self):
        # Fires at 15:05 → should re-aggregate the 14:00 partition
        result = self._run(datetime(2024, 3, 15, 15, 5, tzinfo=UTC))
        assert result.partition_key == "2024-03-15T14:00"

    def test_crosses_midnight_boundary(self):
        # Fires at 00:05 → should re-aggregate the previous day's 23:00 partition
        result = self._run(datetime(2024, 3, 15, 0, 5, tzinfo=UTC))
        assert result.partition_key == "2024-03-14T23:00"

    def test_crosses_month_boundary(self):
        # Fires at 00:05 on March 1 → should re-aggregate Feb 28 23:00 (2024 is a leap year)
        result = self._run(datetime(2024, 3, 1, 0, 5, tzinfo=UTC))
        assert result.partition_key == "2024-02-29T23:00"

    def test_partition_key_format(self):
        result = self._run(datetime(2024, 1, 1, 1, 5, tzinfo=UTC))
        assert result.partition_key == "2024-01-01T00:00"

    def test_minutes_and_seconds_are_zeroed(self):
        # Even if the schedule fires late, the partition key must be zero-padded
        result = self._run(datetime(2024, 6, 15, 10, 59, 59, tzinfo=UTC))
        assert result.partition_key == "2024-06-15T09:00"
