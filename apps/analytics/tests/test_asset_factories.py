"""
Unit tests for make_metrics_asset factory.

Verifies that the factory correctly wires asset name, partitions definition,
and optional automation / backfill policy onto the returned AssetsDefinition.
"""

import dagster as dg
import pytest
from sqlalchemy import text

from analytics.defs.asset_factories import make_metrics_asset

_DAILY = dg.DailyPartitionsDefinition(start_date="2024-01-01")
_HOURLY = dg.HourlyPartitionsDefinition(start_date="2024-01-01-00:00")


class TestMakeMetricsAsset:
    def test_asset_key_matches_name(self):
        asset = make_metrics_asset(
            name="my_metrics",
            deps=[],
            partitions_def=_DAILY,
            sql=text("SELECT 1"),
        )
        assert asset.key.path == ["my_metrics"]

    def test_partitions_def_is_preserved(self):
        asset = make_metrics_asset(
            name="hourly_test",
            deps=[],
            partitions_def=_HOURLY,
            sql=text("SELECT 1"),
        )
        assert asset.partitions_def == _HOURLY

    def test_no_automation_condition_by_default(self):
        asset = make_metrics_asset(
            name="plain_asset",
            deps=[],
            partitions_def=_DAILY,
            sql=text("SELECT 1"),
        )
        assert asset.automation_conditions_by_key == {}

    def test_automation_condition_is_applied(self):
        condition = dg.AutomationCondition.eager()
        asset = make_metrics_asset(
            name="conditioned",
            deps=[],
            partitions_def=_DAILY,
            sql=text("SELECT 1"),
            automation_condition=condition,
        )
        assert asset.automation_conditions_by_key != {}

    def test_backfill_policy_is_applied(self):
        policy = dg.BackfillPolicy.multi_run(30)
        asset = make_metrics_asset(
            name="backfill_asset",
            deps=[],
            partitions_def=_DAILY,
            sql=text("SELECT 1"),
            backfill_policy=policy,
        )
        assert asset.backfill_policy == policy

    @pytest.mark.parametrize("name", ["daily_metrics", "weekly_metrics", "yearly_metrics"])
    def test_different_names_produce_distinct_assets(self, name):
        asset = make_metrics_asset(
            name=name,
            deps=[],
            partitions_def=_DAILY,
            sql=text("SELECT 1"),
        )
        assert asset.key.path == [name]
