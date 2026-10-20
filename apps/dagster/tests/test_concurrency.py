from pathlib import Path

import pytest
import yaml

from analytics.defs.assets import (
    all_time_metrics,
    daily_metrics,
    hourly_metrics,
    monthly_metrics,
    weekly_metrics,
    yearly_metrics,
)

METRICS_ASSETS = [
    all_time_metrics,
    hourly_metrics,
    daily_metrics,
    weekly_metrics,
    monthly_metrics,
    yearly_metrics,
]

_DAGSTER_YAML = Path(__file__).resolve().parent.parent / "dagster.yaml"


@pytest.mark.parametrize("asset", METRICS_ASSETS, ids=lambda a: a.key.path[-1])
def test_each_metrics_asset_has_its_own_pool(asset):
    # Pools apply to every run type (schedules, automation conditions and
    # backfills), unlike job tags.
    [pool] = asset.node_def.pools
    assert pool == f"metrics/{asset.key.path[-1]}"


def test_pools_do_not_set_a_default_limit():
    # A default limit makes Dagster's Postgres storage INSERT and then UPDATE in
    # the same aborted transaction when the pool row already exists
    # (InFailedSqlTransaction), so limits are set explicitly per pool.
    config = yaml.safe_load(_DAGSTER_YAML.read_text())
    assert "default_limit" not in config["concurrency"].get("pools", {})
