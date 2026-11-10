import io
import json
import urllib.error
from datetime import UTC, datetime
from unittest.mock import MagicMock, patch

import pytest

from analytics import backfill_rollup_change as cli
from analytics.definitions import defs
from analytics.defs.assets import (
    daily_partitions,
    hourly_partitions,
    monthly_partitions,
    weekly_partitions,
    yearly_partitions,
)

LABELLED = "0x0100000000000000000000000000000000000000"
UNLABELLED = "0x0200000000000000000000000000000000000000"
NO_TXS = "0x0700000000000000000000000000000000000000"
UPPERCASE = "0xABCDEF0000000000000000000000000000000000"
GRAPHQL_URL = "http://dagster.test/graphql"


def _graphql_response(body: dict) -> MagicMock:
    response = MagicMock()
    response.__enter__.return_value = io.BytesIO(json.dumps(body).encode())
    return response


def _success(backfill_id: str = "abc123") -> MagicMock:
    return _graphql_response(
        {
            "data": {
                "launchPartitionBackfill": {
                    "__typename": "LaunchBackfillSuccess",
                    "backfillId": backfill_id,
                },
            },
        },
    )


class TestNormalizeAddresses:
    def test_lowercases_and_removes_duplicates(self):
        assert cli.normalize_addresses([UPPERCASE, UPPERCASE.lower()]) == [
            UPPERCASE.lower(),
        ]

    def test_rejects_invalid_addresses(self):
        with pytest.raises(cli.BackfillError, match="Invalid addresses"):
            cli.normalize_addresses(["0x1234"])


class TestReadMigrationAddresses:
    def test_reads_addresses_and_ignores_comments(self, tmp_path):
        migration = tmp_path / "migration.sql"
        migration.write_text(
            f"-- Previously {NO_TXS}\n"
            f"UPDATE address SET rollup = 'base'::rollup WHERE address = '{LABELLED}';"
            f" -- {UNLABELLED}\n",
        )
        assert cli.read_migration_addresses(migration) == [LABELLED]

    def test_ignores_longer_hex_values(self, tmp_path):
        migration = tmp_path / "migration.sql"
        migration.write_text(f"SELECT '{LABELLED}00';")
        assert cli.read_migration_addresses(migration) == []

    def test_reports_a_missing_file(self, tmp_path):
        with pytest.raises(cli.BackfillError, match="Cannot read"):
            cli.read_migration_addresses(tmp_path / "missing.sql")


def test_sqlalchemy_url_removes_the_prisma_schema_parameter():
    url = cli.sqlalchemy_url("postgresql://u:p@host:5432/db?schema=public")
    assert url == "postgresql://u:p@host:5432/db"


class TestPartitionRange:
    start = datetime(2026, 3, 7, 16, 37, tzinfo=UTC)

    @pytest.mark.parametrize(
        ("partitions_def", "expected"),
        [
            (hourly_partitions, "2026-03-07T16:00"),
            (daily_partitions, "2026-03-07"),
            (weekly_partitions, "2026-03-02"),
            (monthly_partitions, "2026-03"),
            (yearly_partitions, "2026"),
        ],
    )
    def test_starts_at_the_partition_that_contains_the_start(
        self,
        partitions_def,
        expected,
    ):
        first_key, last_key = cli.partition_range(partitions_def, self.start)
        assert first_key == expected
        assert last_key == partitions_def.get_last_partition_key()

    @pytest.mark.parametrize(
        "partitions_def",
        [
            hourly_partitions,
            daily_partitions,
            weekly_partitions,
            monthly_partitions,
            yearly_partitions,
        ],
    )
    def test_uses_the_first_partition_for_an_earlier_start(self, partitions_def):
        first_key, _ = cli.partition_range(
            partitions_def,
            datetime(2020, 1, 1, tzinfo=UTC),
        )
        assert first_key == partitions_def.get_first_partition_key()


class TestBuildPartitionsByAssets:
    def test_selects_every_metrics_asset_that_stores_the_rollup(self):
        graph = defs().resolve_asset_graph()
        asset_names = {key.to_user_string() for key in graph.get_all_asset_keys()}
        # The address metrics do not store the rollup, so a rollup change does
        # not change them.
        rollup_assets = {n for n in asset_names if not n.startswith("address_")}
        assert set(cli.ASSET_PARTITIONS) == rollup_assets

    def test_all_time_metrics_has_no_partitions(self):
        selection = cli.build_partitions_by_assets(TestPartitionRange.start)
        by_name = {item["assetKey"]["path"][0]: item for item in selection}
        assert by_name["all_time_metrics"]["partitions"] is None
        assert by_name["weekly_metrics"]["partitions"]["range"]["start"] == "2026-03-02"


SELECTION = [{"assetKey": {"path": ["all_time_metrics"]}, "partitions": None}]


class TestLaunchBackfill:
    def test_sends_the_selection_and_returns_the_id(self):
        with patch("urllib.request.urlopen", return_value=_success()) as urlopen:
            backfill_id = cli.launch_backfill(GRAPHQL_URL, SELECTION, [LABELLED])

        assert backfill_id == "abc123"
        request = urlopen.call_args.args[0]
        assert request.full_url == GRAPHQL_URL
        params = json.loads(request.data)["variables"]["params"]
        assert params["partitionsByAssets"] == SELECTION
        assert params["description"] == LABELLED

    @pytest.mark.parametrize(
        ("body", "message"),
        [
            ({"errors": [{"message": "bad query"}]}, "bad query"),
            (
                {
                    "data": {
                        "launchPartitionBackfill": {
                            "__typename": "PythonError",
                            "message": "boom",
                        },
                    },
                },
                "boom",
            ),
        ],
    )
    def test_reports_api_errors(self, body, message):
        response = _graphql_response(body)
        with (
            patch("urllib.request.urlopen", return_value=response),
            pytest.raises(cli.BackfillError, match=message),
        ):
            cli.launch_backfill(GRAPHQL_URL, SELECTION, [LABELLED])

    def test_reports_the_body_of_http_errors(self):
        error = urllib.error.HTTPError(
            GRAPHQL_URL,
            500,
            "Internal Server Error",
            None,
            io.BytesIO(b"no code location"),
        )
        with (
            patch("urllib.request.urlopen", side_effect=error),
            pytest.raises(cli.BackfillError, match="500: no code location"),
        ):
            cli.launch_backfill(GRAPHQL_URL, SELECTION, [LABELLED])

    def test_rejects_other_url_schemes(self):
        with pytest.raises(cli.BackfillError, match="http or https"):
            cli.launch_backfill("file:///etc/passwd", SELECTION, [LABELLED])


def _status(status: str) -> MagicMock:
    return _graphql_response(
        {
            "data": {
                "partitionBackfillOrError": {
                    "__typename": "PartitionBackfill",
                    "status": status,
                },
            },
        },
    )


class TestWaitForBackfill:
    @pytest.fixture(autouse=True)
    def _no_sleep(self):
        with patch("time.sleep"):
            yield

    def test_returns_when_the_backfill_succeeds(self, capsys):
        responses = [
            _status("REQUESTED"),
            _status("REQUESTED"),
            _status("COMPLETED_SUCCESS"),
        ]
        with patch("urllib.request.urlopen", side_effect=responses) as urlopen:
            cli.wait_for_backfill(GRAPHQL_URL, "abc")

        assert urlopen.call_count == len(responses)
        out = capsys.readouterr().out
        assert out.count("REQUESTED") == 1
        assert "COMPLETED_SUCCESS" in out

    @pytest.mark.parametrize(
        "status",
        ["COMPLETED_FAILED", "FAILED", "CANCELED", "COMPLETED"],
    )
    def test_raises_for_other_final_statuses(self, status):
        with (
            patch("urllib.request.urlopen", return_value=_status(status)),
            pytest.raises(cli.BackfillError, match=status),
        ):
            cli.wait_for_backfill(GRAPHQL_URL, "abc")

    def test_keeps_waiting_while_canceling(self):
        responses = [_status("CANCELING"), _status("CANCELED")]
        with (
            patch("urllib.request.urlopen", side_effect=responses),
            pytest.raises(cli.BackfillError, match="CANCELED"),
        ):
            cli.wait_for_backfill(GRAPHQL_URL, "abc")

    def test_survives_a_short_api_outage(self):
        outage = urllib.error.URLError("connection refused")
        responses = [
            *[outage] * (cli.MAX_CONSECUTIVE_POLL_ERRORS - 1),
            _status("COMPLETED_SUCCESS"),
        ]
        with patch("urllib.request.urlopen", side_effect=responses):
            cli.wait_for_backfill(GRAPHQL_URL, "abc")

    def test_an_api_error_count_resets_after_a_success(self):
        outage = urllib.error.URLError("connection refused")
        almost_limit = [outage] * (cli.MAX_CONSECUTIVE_POLL_ERRORS - 1)
        responses = [
            *almost_limit,
            _status("REQUESTED"),
            *almost_limit,
            _status("COMPLETED_SUCCESS"),
        ]
        with patch("urllib.request.urlopen", side_effect=responses):
            cli.wait_for_backfill(GRAPHQL_URL, "abc")

    def test_gives_up_when_the_api_stays_down(self):
        outage = urllib.error.URLError("connection refused")
        with (
            patch("urllib.request.urlopen", side_effect=outage) as urlopen,
            pytest.raises(cli.BackfillError, match="may still be running"),
        ):
            cli.wait_for_backfill(GRAPHQL_URL, "abc")

        assert urlopen.call_count == cli.MAX_CONSECUTIVE_POLL_ERRORS


@pytest.mark.parametrize("suffix", ["/graphql", "/graphql/"])
def test_backfill_url(suffix):
    url = cli.backfill_url(f"http://dagster.test{suffix}", "abc")
    assert url == "http://dagster.test/runs/b/abc"


@pytest.mark.integration
class TestMain:
    @pytest.fixture(autouse=True)
    def _database_url(self, postgres, monkeypatch):
        monkeypatch.setenv("DATABASE_URL", postgres.connection_url)

    def test_fetches_the_rollup_and_first_transaction(self, postgres):
        with postgres.get_connection() as conn:
            states = cli.fetch_address_states(conn, [LABELLED, NO_TXS])

        assert states[0].address == LABELLED
        assert states[0].rollup == "optimism"
        assert states[0].first_tx == datetime(2024, 1, 1, tzinfo=UTC)
        assert states[1].first_tx is None

    def test_a_dry_run_does_not_call_the_api(self, capsys):
        with patch("urllib.request.urlopen") as urlopen:
            exit_code = cli.main(["--address", LABELLED])

        assert exit_code == 0
        urlopen.assert_not_called()
        assert "Dry run" in capsys.readouterr().out

    def test_launch_calls_the_api(self, capsys):
        with patch("urllib.request.urlopen", return_value=_success()) as urlopen:
            exit_code = cli.main(
                ["--address", LABELLED, "--launch", "--graphql-url", GRAPHQL_URL],
            )

        assert exit_code == 0
        urlopen.assert_called_once()
        assert "http://dagster.test/runs/b/abc123" in capsys.readouterr().out

    def test_no_transactions_means_no_backfill(self, capsys):
        with patch("urllib.request.urlopen") as urlopen:
            exit_code = cli.main(["--address", NO_TXS, "--launch"])

        assert exit_code == 0
        urlopen.assert_not_called()
        assert "no backfill is needed" in capsys.readouterr().out

    def test_launch_refuses_unlabelled_addresses(self, capsys):
        with patch("urllib.request.urlopen") as urlopen:
            exit_code = cli.main(["--address", UNLABELLED, "--launch"])

        assert exit_code == 1
        urlopen.assert_not_called()
        assert "--allow-unlabelled" in capsys.readouterr().err

    def test_allow_unlabelled_launches(self):
        with patch("urllib.request.urlopen", return_value=_success()) as urlopen:
            exit_code = cli.main(
                [
                    "--address",
                    UNLABELLED,
                    "--launch",
                    "--allow-unlabelled",
                    "--graphql-url",
                    GRAPHQL_URL,
                ],
            )

        assert exit_code == 0
        urlopen.assert_called_once()

    def test_wait_fails_when_the_backfill_fails(self, capsys):
        responses = [_success(), _status("COMPLETED_FAILED")]
        with patch("urllib.request.urlopen", side_effect=responses):
            exit_code = cli.main(
                [
                    "--address",
                    LABELLED,
                    "--launch",
                    "--wait",
                    "--graphql-url",
                    GRAPHQL_URL,
                ],
            )

        assert exit_code == 1
        assert "COMPLETED_FAILED" in capsys.readouterr().err

    def test_wait_requires_launch(self):
        with pytest.raises(SystemExit):
            cli.main(["--address", LABELLED, "--wait"])

    def test_requires_an_address(self, capsys):
        assert cli.main([]) == 1
        assert "at least one" in capsys.readouterr().err
