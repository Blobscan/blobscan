"""Integration tests for the legacy daily_stats parity check."""

from datetime import date, timedelta

import pytest
from sqlalchemy import text

from analytics.defs.checks import find_legacy_mismatches
from tests.test_assets import (
    DAILY_PERIOD_START,
    _delete_all_tables,
    _seed_daily,
    _seed_hourly,
)

_DAY = DAILY_PERIOD_START.date()
_RANGE = (_DAY, _DAY + timedelta(days=1))


def _copy_daily_metrics_to_legacy(conn, day: date):
    conn.execute(
        text("""
        INSERT INTO daily_stats (
          day, category, rollup, total_transactions, total_blobs, total_blocks
        )
        SELECT
          period_start, category, rollup,
          COALESCE(total_transactions, 0),
          COALESCE(total_blobs, 0),
          COALESCE(total_blocks, 0)
        FROM daily_metrics
        WHERE period_start = :day
        """),
        {"day": day},
    )


@pytest.mark.integration
class TestLegacyParity:
    @pytest.fixture(autouse=True)
    def setup(self, postgres):
        # Tests mutate metrics, so re-seed for each test.
        def clean():
            with postgres.get_connection() as conn:
                _delete_all_tables(conn)
                conn.execute(text("DELETE FROM daily_stats"))
                conn.commit()

        clean()
        _seed_hourly(postgres)
        _seed_daily(postgres)
        yield
        clean()

    def test_no_mismatches_when_legacy_matches(self, postgres):
        with postgres.get_connection() as conn:
            _copy_daily_metrics_to_legacy(conn, _DAY)
            assert find_legacy_mismatches(conn, *_RANGE) == []

    def test_days_missing_from_legacy_are_ignored(self, postgres):
        with postgres.get_connection() as conn:
            assert find_legacy_mismatches(conn, *_RANGE) == []

    def test_reports_differing_counts(self, postgres):
        with postgres.get_connection() as conn:
            _copy_daily_metrics_to_legacy(conn, _DAY)
            conn.execute(
                text("""
                UPDATE daily_stats SET total_transactions = total_transactions + 1
                WHERE day = :day AND category IS NULL AND rollup IS NULL
                """),
                {"day": _DAY},
            )
            mismatches = find_legacy_mismatches(conn, *_RANGE)

        assert len(mismatches) == 1
        row = mismatches[0]
        assert row["category"] is None
        assert row["rollup"] is None
        assert (
            row["legacy_total_transactions"] == row["new_total_transactions"] + 1
        )

    def test_reports_groups_missing_from_new_pipeline(self, postgres):
        with postgres.get_connection() as conn:
            _copy_daily_metrics_to_legacy(conn, _DAY)
            conn.execute(
                text("""
                DELETE FROM daily_metrics
                WHERE period_start = :day AND rollup IS NOT NULL
                """),
                {"day": _DAY},
            )
            mismatches = find_legacy_mismatches(conn, *_RANGE)

        assert mismatches
        assert all(row["new_total_transactions"] is None for row in mismatches)
