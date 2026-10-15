"""Unit tests for sensor partition key generation.

Each sensor computes a partition key based on the current time. Tests freeze
`datetime.now` to a known instant and verify the key is formatted correctly.

Reference date: 2024-03-15 14:37:12 UTC (a Friday)
"""

from datetime import UTC, datetime
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
FIXED_NOW = datetime(2024, 3, 15, 14, 37, 12, tzinfo=UTC)


def _run_sensor(sensor_fn) -> list[dg.RunRequest]:
    context = dg.build_sensor_context()
    return list(sensor_fn(context))


class TestLiveHourlySensor:
    def test_partition_key_is_floored_to_current_hour(self):
        with patch("analytics.defs.sensors.datetime") as mock_dt:
            mock_dt.now.return_value = FIXED_NOW
            requests = _run_sensor(live_hourly_sensor)

        assert len(requests) == 1
        assert requests[0].partition_key == "2024-03-15T14:00"

    def test_partition_key_format(self):
        fixed = datetime(2024, 1, 5, 9, 59, 59, tzinfo=UTC)
        with patch("analytics.defs.sensors.datetime") as mock_dt:
            mock_dt.now.return_value = fixed
            requests = _run_sensor(live_hourly_sensor)

        assert requests[0].partition_key == "2024-01-05T09:00"


class TestLiveDailySensor:
    def test_partition_key_is_current_date(self):
        with patch("analytics.defs.sensors.datetime") as mock_dt:
            mock_dt.now.return_value = FIXED_NOW
            requests = _run_sensor(live_daily_sensor)

        assert len(requests) == 1
        assert requests[0].partition_key == "2024-03-15"


class TestLiveWeeklySensor:
    def test_partition_key_is_start_of_current_week_on_friday(self):
        # Friday March 15: weekday()=4 → Monday March 11
        with patch("analytics.defs.sensors.datetime") as mock_dt:
            mock_dt.now.return_value = FIXED_NOW
            requests = _run_sensor(live_weekly_sensor)

        assert len(requests) == 1
        assert requests[0].partition_key == "2024-03-11"

    def test_partition_key_on_sunday_is_previous_monday(self):
        # Sunday: weekday()=6 → previous Monday
        sunday = datetime(2024, 3, 17, 8, 0, 0, tzinfo=UTC)
        with patch("analytics.defs.sensors.datetime") as mock_dt:
            mock_dt.now.return_value = sunday
            requests = _run_sensor(live_weekly_sensor)

        assert requests[0].partition_key == "2024-03-11"

    def test_partition_key_on_monday_is_same_day(self):
        # Monday: weekday()=0 → same day
        monday = datetime(2024, 3, 11, 12, 0, 0, tzinfo=UTC)
        with patch("analytics.defs.sensors.datetime") as mock_dt:
            mock_dt.now.return_value = monday
            requests = _run_sensor(live_weekly_sensor)

        assert requests[0].partition_key == "2024-03-11"

    def test_partition_key_is_valid_weekly_partition(self):
        from analytics.defs.assets import weekly_partitions

        with patch("analytics.defs.sensors.datetime") as mock_dt:
            mock_dt.now.return_value = FIXED_NOW
            requests = _run_sensor(live_weekly_sensor)

        assert weekly_partitions.has_partition_key(
            requests[0].partition_key,
            current_time=FIXED_NOW,
        )


class TestLiveMonthlySensor:
    def test_partition_key_is_current_month(self):
        with patch("analytics.defs.sensors.datetime") as mock_dt:
            mock_dt.now.return_value = FIXED_NOW
            requests = _run_sensor(live_monthly_sensor)

        assert len(requests) == 1
        assert requests[0].partition_key == "2024-03"

    def test_partition_key_format_for_january(self):
        jan = datetime(2024, 1, 31, 23, 59, tzinfo=UTC)
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
