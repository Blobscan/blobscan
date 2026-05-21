from datetime import UTC, datetime
from unittest.mock import MagicMock

import pytest
from sqlalchemy import text
from sqlalchemy.sql.elements import TextClause

from analytics.defs.helpers import (
    DENCUN_ACTIVATION,
    build_aggregate_sql,
    execute_sql_window,
    get_partition_start_date,
    partition_meta,
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

        execute_sql_window(context=context, postgres=mock_postgres, sql=sql)

        mock_conn.execute.assert_called_once_with(sql, {"from": start, "to": end})

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
        )

        mock_conn.commit.assert_called_once()
