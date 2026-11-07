from __future__ import annotations

from contextlib import contextmanager
from datetime import UTC, datetime
from unittest.mock import MagicMock, patch

import dagster as dg
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
    BACKFILL_CHANGES_TAG,
    BACKFILL_TRIGGER_TAG,
    address_rollup_change_sensor,
    backfill_start,
    build_backfill_subset,
)

# A fixture address with no rollup. Its first transaction is in block 1008
# (2025-02-05T16:59:59Z).
_UNLABELED_SENDER = "0x0600000000000000000000000000000000000000"
# A fixture address with the BASE rollup. Its first transaction is in block
# 1003 (2025-01-10T12:05:00Z).
_LABELED_SENDER = "0x0400000000000000000000000000000000000000"
# A fixture address that only receives transactions.
_RECEIVER = "0x0700000000000000000000000000000000000000"

_SET_ROLLUP_SQL = text(
    "UPDATE address SET rollup = CAST(:rollup AS rollup) WHERE address = :address",
)


class TestBackfillStart:
    def test_truncates_to_the_hour(self):
        first_sent_at = datetime(2025, 2, 5, 16, 59, 59, tzinfo=UTC)

        assert backfill_start(first_sent_at) == datetime(2025, 2, 5, 16, tzinfo=UTC)

    def test_clamps_to_partitions_start(self):
        first_sent_at = datetime(2024, 1, 1, tzinfo=UTC)

        assert backfill_start(first_sent_at) == hourly_partitions.start


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


def _last_change_id(postgres: PostgresResource) -> int:
    with postgres.get_connection() as conn:
        return conn.execute(
            text("SELECT COALESCE(MAX(id), 0) FROM address_rollup_change"),
        ).scalar()


def _changes_after(postgres: PostgresResource, after: int) -> list[tuple]:
    with postgres.get_connection() as conn:
        return conn.execute(
            text(
                "SELECT address, old_rollup::text, new_rollup::text "
                "FROM address_rollup_change WHERE id > :after ORDER BY id",
            ),
            {"after": after},
        ).all()


@contextmanager
def _updated_address(postgres: PostgresResource, address: str, **values: object):
    """Update the columns of a fixture address, and restore them on exit.

    The restore also changes the rollup, so it adds a row to the change log.
    """
    columns = {"rollup": "rollup::text", **{c: c for c in values if c != "rollup"}}
    select = ", ".join(f"{expr} AS {name}" for name, expr in columns.items())
    with postgres.transaction() as conn:
        previous = conn.execute(
            text(f"SELECT {select} FROM address WHERE address = :address"),  # noqa: S608 - test columns
            {"address": address},
        ).one()._asdict()

    def _set(conn, new: dict) -> None:
        if "rollup" in new:
            conn.execute(_SET_ROLLUP_SQL, {"address": address, "rollup": new["rollup"]})
        for column in new.keys() - {"rollup"}:
            conn.execute(
                text(f"UPDATE address SET {column} = :value WHERE address = :address"),  # noqa: S608 - test columns
                {"address": address, "value": new[column]},
            )

    with postgres.transaction() as conn:
        _set(conn, values)
    try:
        yield
    finally:
        with postgres.transaction() as conn:
            _set(conn, {k: previous[k] for k in values})


def _hourly_keys(request: dg.RunRequest) -> list[str]:
    return sorted(
        request.asset_graph_subset.get_partitions_subset(
            hourly_metrics.key,
        ).get_partition_keys(),
    )


class TestAddressRollupChangeLog:
    def test_logs_rollup_updates(self, postgres: PostgresResource):
        after = _last_change_id(postgres)

        with _updated_address(postgres, _UNLABELED_SENDER, rollup="base"):
            assert _changes_after(postgres, after) == [
                (_UNLABELED_SENDER, None, "base"),
            ]

    def test_ignores_updates_that_keep_the_rollup(
        self, postgres: PostgresResource,
    ):
        after = _last_change_id(postgres)

        with postgres.transaction() as conn:
            conn.execute(
                _SET_ROLLUP_SQL, {"address": _LABELED_SENDER, "rollup": "base"},
            )
            conn.execute(
                text(
                    "UPDATE address SET updated_at = now() WHERE address = :address",
                ),
                {"address": _LABELED_SENDER},
            )

        assert _changes_after(postgres, after) == []

    def test_ignores_inserts(self, postgres: PostgresResource):
        after = _last_change_id(postgres)
        address = "0x0900000000000000000000000000000000000000"

        with postgres.transaction() as conn:
            conn.execute(
                text(
                    "INSERT INTO address (address, rollup) VALUES (:address, 'base')",
                ),
                {"address": address},
            )
        try:
            assert _changes_after(postgres, after) == []
        finally:
            with postgres.transaction() as conn:
                conn.execute(
                    text("DELETE FROM address WHERE address = :address"),
                    {"address": address},
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

    def test_skips_without_changes(self, postgres: PostgresResource):
        cursor = str(_last_change_id(postgres))

        result, alert = self._evaluate(postgres, cursor=cursor)

        assert isinstance(result, dg.SkipReason)
        alert.assert_not_called()

    def test_backfills_from_the_first_hour_of_a_relabeled_address(
        self, postgres: PostgresResource,
    ):
        after = _last_change_id(postgres)

        with _updated_address(postgres, _UNLABELED_SENDER, rollup="base"):
            result, alert = self._evaluate(postgres, cursor=str(after))

        [request] = result.run_requests
        assert request.tags == {
            BACKFILL_TRIGGER_TAG: "address_rollup_change",
            BACKFILL_CHANGES_TAG: f"{after + 1}..{after + 1}",
        }
        assert _hourly_keys(request)[0] == "2025-02-05T16:00"
        assert result.cursor == str(after + 1)
        assert _UNLABELED_SENDER in alert.call_args.args[0]

    def test_backfills_when_a_rollup_is_removed(
        self, postgres: PostgresResource,
    ):
        after = _last_change_id(postgres)

        with _updated_address(postgres, _LABELED_SENDER, rollup=None):
            result, _ = self._evaluate(postgres, cursor=str(after))

        [request] = result.run_requests
        assert _hourly_keys(request)[0] == "2025-01-10T12:00"

    def test_uses_the_transactions_without_first_block_number(
        self, postgres: PostgresResource,
    ):
        # A reorg of the first block of the address sets the column to NULL
        after = _last_change_id(postgres)

        with _updated_address(
            postgres,
            _UNLABELED_SENDER,
            first_block_number_as_sender=None,
            rollup="base",
        ):
            result, _ = self._evaluate(postgres, cursor=str(after))

        [request] = result.run_requests
        assert _hourly_keys(request)[0] == "2025-02-05T16:00"

    def test_backfills_from_the_earliest_of_several_addresses(
        self, postgres: PostgresResource,
    ):
        after = _last_change_id(postgres)

        with (
            _updated_address(postgres, _UNLABELED_SENDER, rollup="base"),
            _updated_address(postgres, _LABELED_SENDER, rollup="zora"),
        ):
            result, alert = self._evaluate(postgres, cursor=str(after))

        [request] = result.run_requests
        assert _hourly_keys(request)[0] == "2025-01-10T12:00"
        assert result.cursor == str(after + 2)
        assert "2 address(es)" in alert.call_args.args[0]

    def test_reads_changes_made_before_the_first_evaluation(
        self, postgres: PostgresResource,
    ):
        with _updated_address(postgres, _UNLABELED_SENDER, rollup="base"):
            last = _last_change_id(postgres)
            result, _ = self._evaluate(postgres, cursor=None)

        [request] = result.run_requests
        assert request.tags[BACKFILL_CHANGES_TAG] == f"1..{last}"
        assert result.cursor == str(last)

    def test_does_not_backfill_addresses_without_transactions(
        self, postgres: PostgresResource,
    ):
        after = _last_change_id(postgres)

        with _updated_address(postgres, _RECEIVER, rollup="base"):
            result, alert = self._evaluate(postgres, cursor=str(after))

        assert not result.run_requests
        assert result.cursor == str(after + 1)
        alert.assert_not_called()
