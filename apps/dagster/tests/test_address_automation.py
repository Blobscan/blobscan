"""Unit tests for the automation conditions of the address metrics assets.

address_hourly_metrics follows each update of hourly_metrics, and
address_daily_metrics follows address_hourly_metrics. address_all_time_metrics
runs only after an update of a closed day.
"""

from datetime import UTC, datetime

import dagster as dg
import pytest

from analytics.defs.assets import (
    address_all_time_metrics,
    address_daily_metrics,
    address_hourly_metrics,
    hourly_metrics,
)

PARTITIONED = [hourly_metrics, address_hourly_metrics, address_daily_metrics]
ASSETS = [*PARTITIONED, address_all_time_metrics]

DEFS = dg.Definitions(
    assets=ASSETS,
    resources={"postgres": dg.ResourceDefinition.none_resource()},
)

# Wednesday 2024-03-20 14:20 UTC, after DAGSTER_METRICS_START_DATE.
NOW = datetime(2024, 3, 20, 14, 20, tzinfo=UTC)


class Evaluator:
    """Evaluate the automation conditions on an ephemeral instance."""

    def __init__(self) -> None:
        """Start with an empty instance and no evaluation cursor."""
        self.instance = dg.DagsterInstance.ephemeral()
        self.cursor = None

    def materialize(self, asset: dg.AssetsDefinition, keys: list[str | None]) -> None:
        for key in keys:
            self.instance.report_runless_asset_event(
                dg.AssetMaterialization(asset_key=asset.key, partition=key),
            )

    def evaluate(self) -> dict[str, set[str] | bool]:
        result = dg.evaluate_automation_conditions(
            defs=DEFS,
            instance=self.instance,
            evaluation_time=NOW,
            cursor=self.cursor,
        )
        self.cursor = result.cursor
        requested: dict[str, set[str] | bool] = {}
        for asset in PARTITIONED:
            keys = result.get_requested_partitions(asset.key)
            if keys:
                requested[asset.key.to_user_string()] = keys
        if result.get_num_requested(address_all_time_metrics.key):
            requested["address_all_time_metrics"] = True
        return requested


@pytest.fixture
def evaluator() -> Evaluator:
    """Return an evaluator where every partition up to NOW is materialized."""
    evaluator = Evaluator()
    with dg.partition_loading_context(effective_dt=NOW):
        for asset in PARTITIONED:
            assert asset.partitions_def is not None
            evaluator.materialize(
                asset, asset.partitions_def.get_partition_keys(current_time=NOW),
            )
    evaluator.materialize(address_all_time_metrics, [None])
    assert evaluator.evaluate() == {}
    return evaluator


class TestAddressCascade:
    def test_hourly_metrics_update_requests_address_hour(self, evaluator):
        evaluator.materialize(hourly_metrics, ["2024-03-20T14:00"])
        assert evaluator.evaluate() == {
            "address_hourly_metrics": {"2024-03-20T14:00"},
        }

    def test_address_hour_update_requests_its_day(self, evaluator):
        evaluator.materialize(address_hourly_metrics, ["2024-03-20T14:00"])
        assert evaluator.evaluate() == {"address_daily_metrics": {"2024-03-20"}}

    def test_current_day_update_does_not_request_all_time(self, evaluator):
        evaluator.materialize(address_daily_metrics, ["2024-03-20"])
        assert evaluator.evaluate() == {}

    def test_closed_day_update_requests_all_time(self, evaluator):
        # The catch-up schedule updates the last hours of the closed day.
        evaluator.materialize(address_daily_metrics, ["2024-03-19"])
        assert evaluator.evaluate() == {"address_all_time_metrics": True}

    def test_all_time_is_requested_once_for_a_closed_day(self, evaluator):
        evaluator.materialize(address_daily_metrics, ["2024-03-19"])
        assert evaluator.evaluate() == {"address_all_time_metrics": True}
        evaluator.materialize(address_all_time_metrics, [None])
        assert evaluator.evaluate() == {}
