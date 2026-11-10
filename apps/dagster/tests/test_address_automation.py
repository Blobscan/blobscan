"""Unit tests for the automation conditions of the address metrics assets.

address_hourly_metrics follows each update of hourly_metrics, and
address_daily_metrics follows address_hourly_metrics. The weekly and the
monthly levels follow the daily level, and the yearly level follows the
monthly level. address_all_time_metrics runs only after an update of a closed
day, month or year.
"""

from datetime import UTC, datetime

import dagster as dg
import pytest

from analytics.defs.assets import (
    address_all_time_metrics,
    address_daily_metrics,
    address_hourly_metrics,
    address_monthly_metrics,
    address_weekly_metrics,
    address_yearly_metrics,
    hourly_metrics,
)

PARTITIONED = [
    hourly_metrics,
    address_hourly_metrics,
    address_daily_metrics,
    address_weekly_metrics,
    address_monthly_metrics,
    address_yearly_metrics,
]
ASSETS = [*PARTITIONED, address_all_time_metrics]

DEFS = dg.Definitions(
    assets=ASSETS,
    resources={"postgres": dg.ResourceDefinition.none_resource()},
)

# Wednesday 2024-03-20 14:20 UTC, after DAGSTER_METRICS_START_DATE.
NOW = datetime(2024, 3, 20, 14, 20, tzinfo=UTC)
# Tuesday 2024-04-02 14:20 UTC. March 2024 is a closed month.
NEXT_MONTH = datetime(2024, 4, 2, 14, 20, tzinfo=UTC)


class Evaluator:
    """Evaluate the automation conditions on an ephemeral instance."""

    def __init__(self, now: datetime = NOW) -> None:
        """Start with an empty instance and no evaluation cursor."""
        self.instance = dg.DagsterInstance.ephemeral()
        self.cursor = None
        self.now = now

    def materialize(self, asset: dg.AssetsDefinition, keys: list[str | None]) -> None:
        for key in keys:
            self.instance.report_runless_asset_event(
                dg.AssetMaterialization(asset_key=asset.key, partition=key),
            )

    def evaluate(self) -> dict[str, set[str] | bool]:
        result = dg.evaluate_automation_conditions(
            defs=DEFS,
            instance=self.instance,
            evaluation_time=self.now,
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


def _materialized_evaluator(now: datetime) -> Evaluator:
    """Return an evaluator where every partition up to ``now`` is materialized."""
    evaluator = Evaluator(now)
    with dg.partition_loading_context(effective_dt=now):
        for asset in PARTITIONED:
            assert asset.partitions_def is not None
            evaluator.materialize(
                asset, asset.partitions_def.get_partition_keys(current_time=now),
            )
    evaluator.materialize(address_all_time_metrics, [None])
    assert evaluator.evaluate() == {}
    return evaluator


@pytest.fixture
def evaluator() -> Evaluator:
    return _materialized_evaluator(NOW)


@pytest.fixture
def next_month_evaluator() -> Evaluator:
    return _materialized_evaluator(NEXT_MONTH)


class TestAddressCascade:
    def test_hourly_metrics_update_requests_address_hour(self, evaluator):
        evaluator.materialize(hourly_metrics, ["2024-03-20T14:00"])
        assert evaluator.evaluate() == {
            "address_hourly_metrics": {"2024-03-20T14:00"},
        }

    def test_address_hour_update_requests_its_day(self, evaluator):
        evaluator.materialize(address_hourly_metrics, ["2024-03-20T14:00"])
        assert evaluator.evaluate() == {"address_daily_metrics": {"2024-03-20"}}

    def test_current_day_update_requests_its_week_and_month(self, evaluator):
        # The current day does not change the all-time rows.
        evaluator.materialize(address_daily_metrics, ["2024-03-20"])
        assert evaluator.evaluate() == {
            "address_weekly_metrics": {"2024-03-18"},
            "address_monthly_metrics": {"2024-03"},
        }

    def test_closed_day_update_requests_its_periods_and_all_time(self, evaluator):
        # The catch-up schedule updates the last hours of the closed day.
        evaluator.materialize(address_daily_metrics, ["2024-03-19"])
        assert evaluator.evaluate() == {
            "address_weekly_metrics": {"2024-03-18"},
            "address_monthly_metrics": {"2024-03"},
            "address_all_time_metrics": True,
        }

    def test_all_time_is_requested_once_for_a_closed_day(self, evaluator):
        evaluator.materialize(address_daily_metrics, ["2024-03-19"])
        assert evaluator.evaluate()["address_all_time_metrics"] is True
        evaluator.materialize(address_all_time_metrics, [None])
        assert evaluator.evaluate() == {}

    def test_current_month_update_requests_its_year_only(self, evaluator):
        evaluator.materialize(address_monthly_metrics, ["2024-03"])
        assert evaluator.evaluate() == {"address_yearly_metrics": {"2024"}}

    def test_week_update_requests_nothing(self, evaluator):
        # The all-time SQL does not read the weekly rows.
        evaluator.materialize(address_weekly_metrics, ["2024-03-11"])
        assert evaluator.evaluate() == {}


class TestAddressClosedMonth:
    def test_closed_month_update_requests_its_year_and_all_time(
        self, next_month_evaluator,
    ):
        # For example, after the last day of March closes.
        next_month_evaluator.materialize(address_monthly_metrics, ["2024-03"])
        assert next_month_evaluator.evaluate() == {
            "address_yearly_metrics": {"2024"},
            "address_all_time_metrics": True,
        }

    def test_rerun_of_a_day_in_a_closed_month_updates_the_month(
        self, next_month_evaluator,
    ):
        next_month_evaluator.materialize(address_daily_metrics, ["2024-03-15"])
        assert next_month_evaluator.evaluate() == {
            "address_weekly_metrics": {"2024-03-11"},
            "address_monthly_metrics": {"2024-03"},
            "address_all_time_metrics": True,
        }

    def test_current_year_update_does_not_request_all_time(
        self, next_month_evaluator,
    ):
        next_month_evaluator.materialize(address_yearly_metrics, ["2024"])
        assert next_month_evaluator.evaluate() == {}
