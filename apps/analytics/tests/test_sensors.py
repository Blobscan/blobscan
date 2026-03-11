"""
Unit tests for sensor partition key generation.

Each sensor computes a partition key based on the current time. Tests freeze
`datetime.now` to a known instant and verify the key is formatted correctly.

Reference date: 2024-03-15 14:37:12 UTC (a Friday)
"""

from datetime import datetime, timezone
from unittest.mock import patch

import dagster as dg

from analytics.defs.sensors import (
    live_daily_sensor,
    live_hourly_sensor,
    live_monthly_sensor,
    live_weekly_sensor,
    live_yearly_sensor,
)

# Friday 2024-03-15 14:37:12 UTC — a convenient fixed reference
FIXED_NOW = datetime(2024, 3, 15, 14, 37, 12, tzinfo=timezone.utc)


def _run_sensor(sensor_fn) -> list[dg.RunRequest]:
    context = dg.build_sensor_context()
    return list(sensor_fn(context))


class TestLiveHourlySensor:
    def test_partition_key_is_floored_to_current_hour(self):
        with patch("analytics.defs.sensors.datetime") as mock_dt:
            mock_dt.now.return_value = FIXED_NOW
            requests = _run_sensor(live_hourly_sensor)

        assert len(requests) == 1
        assert requests[0].partition_key == "2024-03-15-14:00"

    def test_partition_key_format(self):
        fixed = datetime(2024, 1, 5, 9, 59, 59, tzinfo=timezone.utc)
        with patch("analytics.defs.sensors.datetime") as mock_dt:
            mock_dt.now.return_value = fixed
            requests = _run_sensor(live_hourly_sensor)

        assert requests[0].partition_key == "2024-01-05-09:00"


class TestLiveDailySensor:
    def test_partition_key_is_current_date(self):
        with patch("analytics.defs.sensors.datetime") as mock_dt:
            mock_dt.now.return_value = FIXED_NOW
            requests = _run_sensor(live_daily_sensor)

        assert len(requests) == 1
        assert requests[0].partition_key == "2024-03-15"


class TestLiveWeeklySensor:
    def test_partition_key_is_start_of_current_week_on_friday(self):
        # Friday March 15: weekday()=4, (4+1)%7=5 days back → Sunday March 10
        with patch("analytics.defs.sensors.datetime") as mock_dt:
            mock_dt.now.return_value = FIXED_NOW
            requests = _run_sensor(live_weekly_sensor)

        assert len(requests) == 1
        assert requests[0].partition_key == "2024-03-10"

    def test_partition_key_on_sunday_is_same_day(self):
        # Sunday: weekday()=6, (6+1)%7=0 days back → same day
        sunday = datetime(2024, 3, 10, 8, 0, 0, tzinfo=timezone.utc)
        with patch("analytics.defs.sensors.datetime") as mock_dt:
            mock_dt.now.return_value = sunday
            requests = _run_sensor(live_weekly_sensor)

        assert requests[0].partition_key == "2024-03-10"

    def test_partition_key_on_monday_is_previous_sunday(self):
        # Monday: weekday()=0, (0+1)%7=1 day back → previous Sunday
        monday = datetime(2024, 3, 11, 12, 0, 0, tzinfo=timezone.utc)
        with patch("analytics.defs.sensors.datetime") as mock_dt:
            mock_dt.now.return_value = monday
            requests = _run_sensor(live_weekly_sensor)

        assert requests[0].partition_key == "2024-03-10"


class TestLiveMonthlySensor:
    def test_partition_key_is_current_month(self):
        with patch("analytics.defs.sensors.datetime") as mock_dt:
            mock_dt.now.return_value = FIXED_NOW
            requests = _run_sensor(live_monthly_sensor)

        assert len(requests) == 1
        assert requests[0].partition_key == "2024-03"

    def test_partition_key_format_for_january(self):
        jan = datetime(2024, 1, 31, 23, 59, tzinfo=timezone.utc)
        with patch("analytics.defs.sensors.datetime") as mock_dt:
            mock_dt.now.return_value = jan
            requests = _run_sensor(live_monthly_sensor)

        assert requests[0].partition_key == "2024-01"


class TestLiveYearlySensor:
    def test_partition_key_is_current_year(self):
        with patch("analytics.defs.sensors.datetime") as mock_dt:
            mock_dt.now.return_value = FIXED_NOW
            requests = _run_sensor(live_yearly_sensor)

        assert len(requests) == 1
        assert requests[0].partition_key == "2024"
