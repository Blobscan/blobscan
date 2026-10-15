from datetime import UTC, datetime, timedelta
from unittest.mock import MagicMock

import pytest
from sqlalchemy import text
from sqlalchemy.sql.elements import TextClause

from analytics.defs.helpers import (
    DENCUN_ACTIVATION,
    build_aggregate_sql,
    execute_sql_window,
    execute_sqls_window,
    get_partition_start_date,
    partition_meta,
    start_of_week,
)


class TestBuildAggregateSql:
    def test_returns_text_clause(self):
        result = build_aggregate_sql("source", "target", "day")
        assert isinstance(result, TextClause)

    def test_replaces_source_table(self):
        result = build_aggregate_sql("hourly_metrics", "daily_metrics", "day")
        assert "hourly_metrics" in result.text
        assert "{{source_table}}" not in result.text

    def test_replaces_target_table(self):
        result = build_aggregate_sql("hourly_metrics", "daily_metrics", "day")
        assert "daily_metrics" in result.text
        assert "{{target_table}}" not in result.text

    def test_replaces_trunc(self):
        result = build_aggregate_sql("hourly_metrics", "daily_metrics", "week")
        assert "week" in result.text
        assert "{{trunc}}" not in result.text

    def test_no_remaining_placeholders(self):
        result = build_aggregate_sql("src", "tgt", "month")
        assert "{{" not in result.text
        assert "}}" not in result.text


class TestPartitionMeta:
    def test_with_partition_key_range(self):
        context = MagicMock()
        context.partition_key_range.start = "2024-01-01-00:00"
        context.partition_key_range.end = "2024-01-02-00:00"
        assert partition_meta(context) == "2024-01-01-00:00..2024-01-02-00:00"

    def test_without_range_falls_back_to_partition_key(self):
        context = MagicMock()
        context.partition_key_range = None
        context.partition_key = "2024-01-01"
        assert partition_meta(context) == "2024-01-01"

    def test_without_range_or_key_returns_none(self):
        # spec=[] means no attributes exist, so getattr returns the defaults (None)
        context = MagicMock(spec=[])
        assert partition_meta(context) is None


class TestGetPartitionStartDate:
    def test_valid_datetime_format_env_var(self, monkeypatch: pytest.MonkeyPatch):
        monkeypatch.setenv("DAGSTER_METRICS_START_DATE", "2024-03-13T13:55")
        monkeypatch.delenv("CHAIN_ID", raising=False)
        result = get_partition_start_date()
        assert result == datetime.strptime(
            "2024-03-13T13:55", "%Y-%m-%dT%H:%M").replace(
            tzinfo=UTC,
        )

    def test_valid_date_format_env_var(self, monkeypatch: pytest.MonkeyPatch):
        monkeypatch.setenv("DAGSTER_METRICS_START_DATE", "2024-03-13")
        monkeypatch.delenv("CHAIN_ID", raising=False)
        result = get_partition_start_date()
        assert result == datetime.strptime("2024-03-13", "%Y-%m-%d").replace(
            tzinfo=UTC,
        )

    def test_invalid_env_var_raises_value_error(self, monkeypatch: pytest.MonkeyPatch):
        monkeypatch.setenv("DAGSTER_METRICS_START_DATE", "not-a-date")
        with pytest.raises(
            ValueError,
            match="Invalid DAGSTER_METRICS_START_DATE format",
        ):
            get_partition_start_date()

    @pytest.mark.parametrize(
        ("chain_id", "expected"),
        [
            (1, datetime(2024, 3, 13, 13, 55, tzinfo=UTC)),
            (11155111, datetime(2024, 1, 30, 22, 51, tzinfo=UTC)),
            (560048, datetime(2025, 3, 17, 12, 0, tzinfo=UTC)),
            (100, datetime(2024, 3, 11, 18, 30, tzinfo=UTC)),
        ],
    )
    def test_known_chain_id_returns_dencun_activation_date(
        self,
        monkeypatch,
        chain_id,
        expected,
    ):
        monkeypatch.delenv("DAGSTER_METRICS_START_DATE", raising=False)
        monkeypatch.setenv("CHAIN_ID", str(chain_id))
        assert get_partition_start_date() == expected

    def test_unknown_chain_id_raises_value_error(self, monkeypatch: pytest.MonkeyPatch):
        monkeypatch.delenv("DAGSTER_METRICS_START_DATE", raising=False)
        monkeypatch.setenv("CHAIN_ID", "9999")
        with pytest.raises(
            ValueError,
            match="Partition start date could not be determined",
        ):
            get_partition_start_date()

    @pytest.mark.parametrize("chain_id", ["", "  ", "mainnet"])
    def test_missing_or_invalid_chain_id_raises_value_error(
        self,
        monkeypatch: pytest.MonkeyPatch,
        chain_id: str,
    ):
        monkeypatch.delenv("DAGSTER_METRICS_START_DATE", raising=False)
        monkeypatch.setenv("CHAIN_ID", chain_id)
        with pytest.raises(ValueError, match="Invalid CHAIN_ID"):
            get_partition_start_date()

    def test_unset_chain_id_raises_value_error(self, monkeypatch: pytest.MonkeyPatch):
        monkeypatch.delenv("DAGSTER_METRICS_START_DATE", raising=False)
        monkeypatch.delenv("CHAIN_ID", raising=False)
        with pytest.raises(ValueError, match="Invalid CHAIN_ID"):
            get_partition_start_date()

    def test_dencun_activation_covers_all_known_chains(self):
        assert set(DENCUN_ACTIVATION.keys()) == {1, 11155111, 560048, 100}


class TestExecuteSqlWindow:
    def make_postgres_mock(self, rowcount: int):
        mock_result = MagicMock()
        mock_result.rowcount = rowcount
        mock_conn = MagicMock()
        mock_conn.execute.return_value = mock_result
        mock_postgres = MagicMock()
        mock_postgres.get_connection.return_value.__enter__.return_value = mock_conn
        mock_postgres.get_connection.return_value.__exit__.return_value = False
        return mock_postgres, mock_conn

    def _make_context(self, start, end):
        context = MagicMock()
        context.partition_time_window.start = start
        context.partition_time_window.end = end
        return context

    def test_returns_rowcount_and_elapsed_ms(self):
        start = datetime(2024, 1, 1, tzinfo=UTC)
        end = datetime(2024, 1, 1, 1, tzinfo=UTC)
        context = self._make_context(start, end)
        mock_postgres, _ = self.make_postgres_mock(rowcount=42)

        rowcount, ms = execute_sql_window(
            context=context,
            postgres=mock_postgres,
            sql=text("SELECT 1"),
            table="daily_metrics",
        )

        assert rowcount == 42
        assert isinstance(ms, int)
        assert ms >= 0

    def test_passes_partition_window_as_params(self):
        start = datetime(2024, 6, 1, 10, 0, tzinfo=UTC)
        end = datetime(2024, 6, 1, 11, 0, tzinfo=UTC)
        context = self._make_context(start, end)
        mock_postgres, mock_conn = self.make_postgres_mock(rowcount=0)
        sql = text("SELECT :from, :to")

        execute_sql_window(
            context=context, postgres=mock_postgres, sql=sql, table="daily_metrics",
        )

        mock_conn.execute.assert_called_with(sql, {"from": start, "to": end})

    def test_deletes_window_before_aggregating(self):
        start = datetime(2024, 6, 1, 10, 0, tzinfo=UTC)
        end = datetime(2024, 6, 1, 11, 0, tzinfo=UTC)
        context = self._make_context(start, end)
        mock_postgres, mock_conn = self.make_postgres_mock(rowcount=0)
        sql = text("SELECT :from, :to")

        execute_sql_window(
            context=context, postgres=mock_postgres, sql=sql, table="daily_metrics",
        )

        assert mock_conn.execute.call_count == 2
        delete_sql, delete_params = mock_conn.execute.call_args_list[0].args
        assert str(delete_sql) == (
            "DELETE FROM daily_metrics "
            "WHERE period_start >= :from AND period_start < :to"
        )
        assert delete_params == {"from": start, "to": end}

    def test_commits_after_execution(self):
        context = self._make_context(
            datetime(2024, 1, 1, tzinfo=UTC),
            datetime(2024, 1, 1, 1, tzinfo=UTC),
        )
        mock_postgres, mock_conn = self.make_postgres_mock(rowcount=5)

        execute_sql_window(
            context=context,
            postgres=mock_postgres,
            sql=text("SELECT 1"),
            table="daily_metrics",
        )

        mock_conn.commit.assert_called_once()

    def test_runs_several_statements_in_one_transaction(self):
        start = datetime(2024, 6, 1, 10, 0, tzinfo=UTC)
        end = datetime(2024, 6, 1, 11, 0, tzinfo=UTC)
        context = self._make_context(start, end)
        mock_postgres, mock_conn = self.make_postgres_mock(rowcount=3)
        first, second = text("SELECT 1"), text("SELECT 2")

        results = execute_sqls_window(
            context=context,
            postgres=mock_postgres,
            sqls=[first, second],
            table="hourly_metrics",
        )

        assert [rowcount for rowcount, _ in results] == [3, 3]
        executed = [c.args[0] for c in mock_conn.execute.call_args_list]
        assert str(executed[0]).startswith("DELETE FROM hourly_metrics")
        assert executed[1:] == [first, second]
        mock_postgres.get_connection.assert_called_once()
        mock_conn.commit.assert_called_once()


class TestStartOfWeek:
    @pytest.mark.parametrize(
        ("dt", "expected"),
        [
            # Monday is the start of its own week
            (
                datetime(2024, 3, 11, 0, 0, tzinfo=UTC),
                datetime(2024, 3, 11, tzinfo=UTC),
            ),
            (
                datetime(2024, 3, 15, 14, 37, tzinfo=UTC),
                datetime(2024, 3, 11, tzinfo=UTC),
            ),
            # Sunday belongs to the week that started the previous Monday
            (
                datetime(2024, 3, 17, 23, 59, tzinfo=UTC),
                datetime(2024, 3, 11, tzinfo=UTC),
            ),
            # Crosses a year boundary
            (
                datetime(2025, 1, 1, 12, 0, tzinfo=UTC),
                datetime(2024, 12, 30, tzinfo=UTC),
            ),
        ],
    )
    def test_returns_monday_midnight(self, dt, expected):
        assert start_of_week(dt) == expected

    @pytest.mark.integration
    def test_matches_postgres_date_trunc_week(self, postgres):
        # Python and SQL must agree on what a week is.
        times = [
            datetime(2024, 2, 20, tzinfo=UTC) + timedelta(hours=7 * i)
            for i in range(120)
        ]
        with postgres.get_connection() as conn:
            for dt in times:
                db_week = conn.execute(
                    text("SELECT DATE_TRUNC('week', CAST(:dt AS timestamptz))"),
                    {"dt": dt},
                ).scalar_one()
                assert start_of_week(dt) == db_week, dt
