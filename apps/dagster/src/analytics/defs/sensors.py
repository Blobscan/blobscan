from datetime import UTC, datetime, timedelta

import dagster as dg

from analytics.defs.assets import (
    daily_metrics,
    hourly_metrics,
    monthly_metrics,
    weekly_metrics,
    yearly_metrics,
)


@dg.sensor(
    asset_selection=dg.AssetSelection.assets(hourly_metrics),
    minimum_interval_seconds=10 * 60,
)
def live_hourly_sensor(_: dg.SensorEvaluationContext):
    now = datetime.now(UTC)
    yield dg.RunRequest(
        partition_key=now.replace(minute=0, second=0, microsecond=0).strftime(
            "%Y-%m-%dT%H:%M",
        ),
    )


@dg.sensor(
    asset_selection=dg.AssetSelection.assets(daily_metrics),
    minimum_interval_seconds=60 * 60,  # every hour
)
def live_daily_sensor(_: dg.SensorEvaluationContext):
    now = datetime.now(UTC)
    yield dg.RunRequest(
        partition_key=now.strftime("%Y-%m-%d"),
    )


@dg.sensor(
    asset_selection=dg.AssetSelection.assets(weekly_metrics),
    minimum_interval_seconds=24 * 60 * 60,  # every day
)
def live_weekly_sensor(_: dg.SensorEvaluationContext):
    now = datetime.now(UTC)
    week_start = now - timedelta(days=(now.weekday() + 1) % 7)
    yield dg.RunRequest(
        partition_key=week_start.strftime("%Y-%m-%d"),
    )


@dg.sensor(
    asset_selection=dg.AssetSelection.assets(monthly_metrics),
    minimum_interval_seconds=24 * 60 * 60,  # every day
)
def live_monthly_sensor(_: dg.SensorEvaluationContext):
    now = datetime.now(UTC)
    yield dg.RunRequest(
        partition_key=now.strftime("%Y-%m"),
    )


@dg.sensor(
    asset_selection=dg.AssetSelection.assets(yearly_metrics),
    minimum_interval_seconds=24 * 60 * 60,  # every day
)
def live_yearly_sensor(_: dg.SensorEvaluationContext):
    now = datetime.now(UTC)
    yield dg.RunRequest(
        partition_key=now.strftime("%Y"),
    )
