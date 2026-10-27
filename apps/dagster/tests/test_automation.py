"""Unit tests for the automation conditions of the rollup levels.

Only the current hourly partition has a live schedule. The current partitions
of the rollup levels must follow it in a cascade: hourly -> daily ->
weekly/monthly -> yearly. all_time_metrics has its own schedule and must not
run from an automation condition.
"""

from datetime import UTC, datetime

import dagster as dg
import pytest

from analytics.defs.assets import (
    all_time_metrics,
    daily_metrics,
    hourly_metrics,
    monthly_metrics,
    weekly_metrics,
    yearly_metrics,
)

ROLLUP_ASSETS = [
    hourly_metrics,
    daily_metrics,
    weekly_metrics,
    monthly_metrics,
    yearly_metrics,
]
ASSETS = [*ROLLUP_ASSETS, all_time_metrics]

# The conditions are only evaluated, the assets are not executed.
DEFS = dg.Definitions(
    assets=ASSETS,
    resources={"postgres": dg.ResourceDefinition.none_resource()},
)

# Wednesday 2024-03-20 14:20 UTC. Must be after DAGSTER_METRICS_START_DATE
# (see conftest.py) so the partitions exist.
NOW = datetime(2024, 3, 20, 14, 20, tzinfo=UTC)


class Evaluator:
    """Evaluate the automation conditions on an ephemeral instance."""

    def __init__(self) -> None:
        """Start with an empty instance and no evaluation cursor."""
        self.instance = dg.DagsterInstance.ephemeral()
        self.cursor = None

    def materialize(self, asset: dg.AssetsDefinition, keys: list[str]) -> None:
        for key in keys:
            self.instance.report_runless_asset_event(
                dg.AssetMaterialization(asset_key=asset.key, partition=key),
            )

    def evaluate(self) -> dict[str, set[str]]:
        result = dg.evaluate_automation_conditions(
            defs=DEFS,
            instance=self.instance,
            evaluation_time=NOW,
            cursor=self.cursor,
        )
        self.cursor = result.cursor
        requested = {
            asset.key.to_user_string(): result.get_requested_partitions(asset.key)
            for asset in ASSETS
        }
        return {name: keys for name, keys in requested.items() if keys}


@pytest.fixture
def evaluator() -> Evaluator:
    """Return an evaluator where every partition up to NOW is materialized."""
    evaluator = Evaluator()
    with dg.partition_loading_context(effective_dt=NOW):
        for asset in ROLLUP_ASSETS:
            assert asset.partitions_def is not None
            evaluator.materialize(
                asset,
                asset.partitions_def.get_partition_keys(current_time=NOW),
            )
    assert evaluator.evaluate() == {}
    return evaluator


class TestRollupCascade:
    def test_current_hour_update_requests_current_day(self, evaluator):
        evaluator.materialize(hourly_metrics, ["2024-03-20T14:00"])
        assert evaluator.evaluate() == {"daily_metrics": {"2024-03-20"}}

    def test_current_day_update_requests_current_week_and_month(self, evaluator):
        evaluator.materialize(daily_metrics, ["2024-03-20"])
        assert evaluator.evaluate() == {
            "weekly_metrics": {"2024-03-18"},
            "monthly_metrics": {"2024-03"},
        }

    def test_current_month_update_requests_current_year(self, evaluator):
        evaluator.materialize(monthly_metrics, ["2024-03"])
        assert evaluator.evaluate() == {"yearly_metrics": {"2024"}}

    def test_completed_hour_update_requests_its_day(self, evaluator):
        # The hourly catch-up schedule updates completed hours
        evaluator.materialize(hourly_metrics, ["2024-03-19T23:00"])
        assert evaluator.evaluate() == {"daily_metrics": {"2024-03-19"}}

    def test_all_time_is_not_requested_by_automation(self, evaluator):
        evaluator.materialize(yearly_metrics, ["2024"])
        assert evaluator.evaluate() == {}
