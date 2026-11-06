from __future__ import annotations

import json
from contextlib import contextmanager
from datetime import UTC, datetime
from unittest.mock import MagicMock, patch

import dagster as dg
import pytest
from sqlalchemy import text

from analytics.defs.assets import (
    daily_metrics,
    hourly_metrics,
    hourly_partitions,
    monthly_metrics,
    weekly_metrics,
    yearly_metrics,
)
from analytics.defs.resources.postgres import PostgresResource
from analytics.defs.rollup_changes import (
    BACKFILL_TAGS,
    address_rollup_change_sensor,
    backfill_start,
    build_backfill_subset,
    changed_addresses,
)

# A fixture address with no rollup. Its first transaction is in block 1008
# (2025-02-05T16:59:59Z).
_UNLABELED_SENDER = "0x0600000000000000000000000000000000000000"
_NOW = datetime(2025, 3, 1, 10, 20, tzinfo=UTC)
_SET_ROLLUP_SQL = text(
    "UPDATE address SET rollup = CAST(:rollup AS rollup) WHERE address = :address",
)


class TestChangedAddresses:
    def test_detects_set_changed_and_removed_rollups(self):
        previous = {"0xa": "base", "0xb": "optimism", "0xc": "zora"}
        current = {"0xa": "base", "0xb": "arbitrum", "0xd": "ink"}

        assert changed_addresses(previous, current) == ["0xb", "0xc", "0xd"]

    def test_no_changes(self):
        assert changed_addresses({"0xa": "base"}, {"0xa": "base"}) == []


class TestBackfillStart:
    def test_none_without_transactions(self):
        assert backfill_start(None, _NOW) is None

    def test_truncates_to_the_hour(self):
        first_sent_at = datetime(2025, 2, 5, 16, 59, 59, tzinfo=UTC)

        assert backfill_start(first_sent_at, _NOW) == datetime(
            2025, 2, 5, 16, tzinfo=UTC,
        )

    def test_clamps_to_partitions_start(self):
        first_sent_at = datetime(2024, 1, 1, tzinfo=UTC)

        assert backfill_start(first_sent_at, _NOW) == hourly_partitions.start

    @pytest.mark.parametrize(
        "first_sent_at",
        [
            datetime(2025, 3, 1, 9, 0, tzinfo=UTC),  # previous hour
            datetime(2025, 3, 1, 10, 5, tzinfo=UTC),  # current hour
        ],
    )
    def test_skips_hours_of_the_live_schedules(self, first_sent_at: datetime):
        assert backfill_start(first_sent_at, _NOW) is None

    def test_includes_the_hour_before_the_catch_up_window(self):
        first_sent_at = datetime(2025, 3, 1, 8, 59, tzinfo=UTC)

        assert backfill_start(first_sent_at, _NOW) == datetime(
            2025, 3, 1, 8, tzinfo=UTC,
        )


class TestBuildBackfillSubset:
    def test_selects_every_level_from_start_to_now(self):
        start = datetime(2025, 1, 31, 10, tzinfo=UTC)
        now = datetime(2025, 2, 1, 1, 10, tzinfo=UTC)

        subset = build_backfill_subset(start, now)
        keys = {
            asset.key: sorted(
                subset.get_partitions_subset(asset.key).get_partition_keys(),
            )
            for asset in (
                hourly_metrics,
                daily_metrics,
                weekly_metrics,
                monthly_metrics,
                yearly_metrics,
            )
        }

        hourly = keys[hourly_metrics.key]
        assert (hourly[0], hourly[-1], len(hourly)) == (
            "2025-01-31T10:00",
            "2025-02-01T01:00",
            16,
        )
        assert keys[daily_metrics.key] == ["2025-01-31", "2025-02-01"]
        assert keys[weekly_metrics.key] == ["2025-01-27"]
        assert keys[monthly_metrics.key] == ["2025-01", "2025-02"]
        assert keys[yearly_metrics.key] == ["2025"]


@contextmanager
def _rollup_of(postgres: PostgresResource, address: str, rollup: str | None):
    """Set the rollup of a fixture address, and restore it on exit."""
    with postgres.transaction() as conn:
        previous = conn.execute(
            text("SELECT rollup::text FROM address WHERE address = :address"),
            {"address": address},
        ).scalar()
        conn.execute(
            _SET_ROLLUP_SQL,
            {"address": address, "rollup": rollup},
        )
    try:
        yield
    finally:
        with postgres.transaction() as conn:
            conn.execute(
                _SET_ROLLUP_SQL,
                {"address": address, "rollup": previous},
            )


class TestAddressRollupChangeSensor:
    @staticmethod
    def _evaluate(
        postgres: PostgresResource, cursor: str | None,
    ) -> tuple[dg.SensorResult | dg.SkipReason, MagicMock]:
        with (
            dg.build_sensor_context(
                cursor=cursor, resources={"postgres": postgres},
            ) as context,
            patch("analytics.defs.rollup_changes.send_alert") as alert,
        ):
            result = address_rollup_change_sensor(context)
        return result, alert

    def test_is_running_by_default(self):
        assert (
            address_rollup_change_sensor.default_status
            == dg.DefaultSensorStatus.RUNNING
        )

    def test_first_evaluation_only_stores_the_snapshot(
        self, postgres: PostgresResource,
    ):
        result, alert = self._evaluate(postgres, cursor=None)

        assert not result.run_requests
        assert json.loads(result.cursor) == {
            "0x0100000000000000000000000000000000000000": "optimism",
            "0x0300000000000000000000000000000000000000": "arbitrum",
            "0x0400000000000000000000000000000000000000": "base",
            "0x0500000000000000000000000000000000000000": "world",
        }
        alert.assert_not_called()

    def test_skips_without_changes(self, postgres: PostgresResource):
        initial, _ = self._evaluate(postgres, cursor=None)

        result, alert = self._evaluate(postgres, cursor=initial.cursor)

        assert isinstance(result, dg.SkipReason)
        alert.assert_not_called()

    def test_backfills_from_the_first_hour_of_a_relabeled_address(
        self, postgres: PostgresResource,
    ):
        initial, _ = self._evaluate(postgres, cursor=None)

        with _rollup_of(postgres, _UNLABELED_SENDER, "base"):
            result, alert = self._evaluate(postgres, cursor=initial.cursor)

        [request] = result.run_requests
        assert request.tags == BACKFILL_TAGS
        hourly_keys = sorted(
            request.asset_graph_subset.get_partitions_subset(
                hourly_metrics.key,
            ).get_partition_keys(),
        )
        assert hourly_keys[0] == "2025-02-05T16:00"
        assert json.loads(result.cursor)[_UNLABELED_SENDER] == "base"
        assert _UNLABELED_SENDER in alert.call_args.args[0]

    def test_backfills_when_a_rollup_is_removed(
        self, postgres: PostgresResource,
    ):
        initial, _ = self._evaluate(postgres, cursor=None)
        labeled = "0x0400000000000000000000000000000000000000"

        with _rollup_of(postgres, labeled, None):
            result, _ = self._evaluate(postgres, cursor=initial.cursor)

        [request] = result.run_requests
        hourly_keys = sorted(
            request.asset_graph_subset.get_partitions_subset(
                hourly_metrics.key,
            ).get_partition_keys(),
        )
        # Block 1003, the first transaction of the address
        assert hourly_keys[0] == "2025-01-10T12:00"
        assert labeled not in json.loads(result.cursor)

    def test_does_not_backfill_addresses_without_transactions(
        self, postgres: PostgresResource,
    ):
        initial, _ = self._evaluate(postgres, cursor=None)
        receiver_only = "0x0200000000000000000000000000000000000000"

        with _rollup_of(postgres, receiver_only, "base"):
            result, alert = self._evaluate(postgres, cursor=initial.cursor)

        assert not result.run_requests
        assert json.loads(result.cursor)[receiver_only] == "base"
        alert.assert_not_called()
