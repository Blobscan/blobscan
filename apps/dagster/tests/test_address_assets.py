"""Integration tests for the address metrics Dagster assets.

The assets run against the containerized database with the standard fixture
data. The expected rows are calculated in Python from the fixtures.

Run with: pytest -m integration
"""

from collections import defaultdict
from datetime import UTC, datetime, timedelta

import dagster as dg
import pytest
from sqlalchemy import text

from analytics.defs import assets as assets_module
from analytics.defs.assets import (
    address_all_time_metrics,
    address_daily_metrics,
    address_hourly_metrics,
)
from analytics.defs.jobs import delete_old_address_hourly_metrics
from analytics.defs.resources.postgres import PostgresResource
from tests.test_assets import (
    _FIXTURES,
    _assert_usd_equal,
    _set_tx_forked,
    _sum_usd,
    get_enriched_txs,
)

HOURLY_PARTITION_KEY = "2025-02-05T16:00"
HOURLY_PERIOD_START = datetime(2025, 2, 5, 16, tzinfo=UTC)

# 2025-02-05 has the self-send (0x06 -> 0x06) and the transaction from the
# receiver 0x02 to the sender 0x01, so 0x01 and 0x02 have both roles.
DAILY_PARTITION_KEY = "2025-02-05"
DAILY_PERIOD_START = datetime(2025, 2, 5, tzinfo=UTC)

SELF_SENDER = "0x0600000000000000000000000000000000000000"
BOTH_ROLES = "0x0200000000000000000000000000000000000000"
RECEIVER_ONLY = "0x0700000000000000000000000000000000000000"

ADDRESS_TABLES = (
    "address_hourly_metrics",
    "address_daily_metrics",
    "address_all_time_metrics",
)

ROLES = ("sent", "received")


# ---------------------------------------------------------------------------
# Expected values
# ---------------------------------------------------------------------------


def _tx_blobs() -> dict[str, tuple[int, int]]:
    """Return (blob count, usage size) for each transaction hash."""
    usage = {b["versionedHash"]: b["usageSize"] for b in _FIXTURES["blobs"]}
    result: dict[str, tuple[int, int]] = defaultdict(lambda: (0, 0))
    for bot in _FIXTURES["blobsOnTxs"]:
        count, size = result[bot["txHash"]]
        result[bot["txHash"]] = (count + 1, size + usage[bot["blobHash"]])
    return result


def expected_rows(
    start: datetime | None = None, end: datetime | None = None,
) -> dict[str, dict]:
    """Return the expected metrics of each address in [start, end)."""
    blobs = _tx_blobs()
    rows: dict[str, dict] = {}

    for tx in get_enriched_txs(start, end):
        count, usage = blobs[tx["hash"]]
        for role, address in (("sent", tx["fromId"]), ("received", tx["toId"])):
            row = rows.setdefault(
                address, {"self": 0, "self_blobs": 0, "sent": [], "received": []}
            )
            row[role].append({**tx, "blobs": count, "usage": usage})
        if tx["fromId"] == tx["toId"]:
            rows[tx["fromId"]]["self"] += 1
            rows[tx["fromId"]]["self_blobs"] += count

    return rows


def _assert_row(actual: dict, expected: dict) -> None:
    for role in ROLES:
        txs = expected[role]
        prefix = f"{role}_"
        assert actual[prefix + "total_transactions"] == len(txs)
        assert actual[prefix + "total_blobs"] == sum(t["blobs"] for t in txs)
        assert actual[prefix + "total_blob_usage_size"] == sum(t["usage"] for t in txs)
        assert actual[prefix + "total_blob_base_fee"] == sum(
            t["blob_base_fee"] for t in txs
        )
        assert actual[prefix + "total_blob_as_calldata_fee"] == sum(
            t["blob_as_calldata_fee"] for t in txs
        )
        _assert_usd_equal(
            actual[prefix + "total_blob_base_fee_usd"],
            _sum_usd([t["blob_base_fee_usd"] for t in txs]),
        )
        _assert_usd_equal(
            actual[prefix + "total_blob_as_calldata_fee_usd"],
            _sum_usd([t["blob_as_calldata_fee_usd"] for t in txs]),
        )
        assert actual[prefix + "total_usd_priced_transactions"] == sum(
            1 for t in txs if t["blob_base_fee_usd"] is not None
        )
        times = [t["blockDatetime"] for t in txs]
        first, last = (min(times), max(times)) if times else (None, None)
        assert actual[prefix + "first_block_timestamp"] == first
        assert actual[prefix + "last_block_timestamp"] == last

    assert actual["self_total_transactions"] == expected["self"]
    assert actual["self_total_blobs"] == expected["self_blobs"]


# ---------------------------------------------------------------------------
# Helpers / fixtures
# ---------------------------------------------------------------------------


def _query(
    postgres: PostgresResource, table: str, **where: object,
) -> dict[str, dict]:
    clause = " AND ".join(f"{k} = :{k}" for k in where) or "TRUE"
    with postgres.get_connection() as conn:
        rows = conn.execute(
            text(f"SELECT * FROM {table} WHERE {clause}"),  # noqa: S608
            where,
        ).mappings().fetchall()
    return {row["address"]: dict(row) for row in rows}


def _run(postgres: PostgresResource, asset: dg.AssetsDefinition, key: str):
    return asset(context=dg.build_asset_context(partition_key=key), postgres=postgres)


def _fixture_days() -> list[str]:
    return sorted({
        datetime.fromisoformat(b["timestamp"]).strftime("%Y-%m-%d")
        for b in _FIXTURES["blocks"]
    })


def _delete_address_tables(postgres: PostgresResource) -> None:
    with postgres.get_connection() as conn:
        for table in ADDRESS_TABLES:
            conn.execute(text(f"DELETE FROM {table}"))  # noqa: S608
        conn.commit()


@pytest.fixture(scope="class")
def clean_address_metrics(postgres):
    _delete_address_tables(postgres)
    yield
    _delete_address_tables(postgres)


@pytest.fixture(scope="class")
def no_hourly_retention():
    """Keep every hour, so the 2025 fixture hours are not skipped."""
    with pytest.MonkeyPatch.context() as mp:
        mp.setattr(
            assets_module,
            "address_hourly_retention_cutoff",
            lambda: datetime(2000, 1, 1, tzinfo=UTC),
        )
        yield


# ---------------------------------------------------------------------------
# Metrics tests
# ---------------------------------------------------------------------------


class _AddressMetricsMixin:
    """Check every row of one period against the fixture data."""

    def _rows(self, postgres) -> dict[str, dict]:
        raise NotImplementedError

    def _expected(self) -> dict[str, dict]:
        raise NotImplementedError

    def test_one_row_for_each_address(self, postgres):
        assert set(self._rows(postgres)) == set(self._expected())

    def test_metrics(self, postgres):
        rows = self._rows(postgres)
        for address, expected in self._expected().items():
            _assert_row(rows[address], expected)

    def test_self_send_counts_in_both_roles(self, postgres):
        row = self._rows(postgres)[SELF_SENDER]
        assert row["self_total_transactions"] >= 1
        assert row["sent_total_transactions"] >= row["self_total_transactions"]
        assert row["received_total_transactions"] >= row["self_total_transactions"]
        assert row["self_total_blobs"] >= 1
        assert row["sent_total_blobs"] >= row["self_total_blobs"]
        assert row["received_total_blobs"] >= row["self_total_blobs"]

    def test_address_with_both_roles(self, postgres):
        row = self._rows(postgres)[BOTH_ROLES]
        assert row["sent_total_transactions"] > 0
        assert row["received_total_transactions"] > 0

    def test_receiver_only_has_no_sent_values(self, postgres):
        row = self._rows(postgres)[RECEIVER_ONLY]
        assert row["sent_total_transactions"] == 0
        assert row["sent_total_blob_base_fee"] == 0
        assert row["sent_total_blob_base_fee_usd"] is None
        assert row["sent_first_block_timestamp"] is None
        assert row["received_total_transactions"] > 0


@pytest.mark.integration
class TestAddressHourlyMetrics(_AddressMetricsMixin):
    @pytest.fixture(scope="class", autouse=True)
    def setup_metrics(self, postgres, clean_address_metrics, no_hourly_retention):  # noqa: ARG002
        _run(postgres, address_hourly_metrics, HOURLY_PARTITION_KEY)

    def _rows(self, postgres):
        return _query(
            postgres, "address_hourly_metrics", period_start=HOURLY_PERIOD_START,
        )

    def _expected(self):
        end = HOURLY_PERIOD_START + timedelta(hours=1)
        return expected_rows(HOURLY_PERIOD_START, end)

    def test_no_rows_for_other_periods(self, postgres):
        with postgres.get_connection() as conn:
            periods = conn.execute(
                text("SELECT DISTINCT period_start FROM address_hourly_metrics"),
            ).scalars().all()
        assert periods == [HOURLY_PERIOD_START.replace(tzinfo=None)]


@pytest.mark.integration
class TestAddressDailyMetrics(_AddressMetricsMixin):
    @pytest.fixture(scope="class", autouse=True)
    def setup_metrics(self, postgres, clean_address_metrics):  # noqa: ARG002
        _run(postgres, address_daily_metrics, DAILY_PARTITION_KEY)

    def _rows(self, postgres):
        return _query(
            postgres, "address_daily_metrics", period_start=DAILY_PERIOD_START.date(),
        )

    def _expected(self):
        end = DAILY_PERIOD_START + timedelta(days=1)
        return expected_rows(DAILY_PERIOD_START, end)

    def test_daily_does_not_need_hourly_rows(self, postgres):
        assert _query(postgres, "address_hourly_metrics") == {}
        assert self._rows(postgres)


@pytest.mark.integration
class TestAddressAllTimeMetrics(_AddressMetricsMixin):
    @pytest.fixture(scope="class", autouse=True)
    def setup_metrics(self, postgres, clean_address_metrics):  # noqa: ARG002
        for day in _fixture_days():
            _run(postgres, address_daily_metrics, day)
        address_all_time_metrics(postgres=postgres)

    def _rows(self, postgres):
        return _query(postgres, "address_all_time_metrics")

    def _expected(self):
        return expected_rows()

    def test_aggregated_until_is_the_last_closed_day(self, postgres):
        today = datetime.now(UTC).date()
        for row in self._rows(postgres).values():
            assert row["aggregated_until"] == today - timedelta(days=1)

    def test_current_day_is_not_included(self, postgres):
        today = datetime.now(UTC).date()
        with postgres.get_connection() as conn:
            conn.execute(
                text(
                    "INSERT INTO address_daily_metrics "
                    "(address, period_start, sent_total_transactions) "
                    "VALUES (:a, :d, 5)",
                ),
                {"a": RECEIVER_ONLY, "d": today},
            )
            conn.commit()
        try:
            address_all_time_metrics(postgres=postgres)
            row = self._rows(postgres)[RECEIVER_ONLY]
            assert row["sent_total_transactions"] == 0
        finally:
            with postgres.get_connection() as conn:
                conn.execute(
                    text("DELETE FROM address_daily_metrics WHERE period_start = :d"),
                    {"d": today},
                )
                conn.commit()
            address_all_time_metrics(postgres=postgres)


# ---------------------------------------------------------------------------
# Reorg
# ---------------------------------------------------------------------------

# The only transaction that 0x02 sends.
_DAILY_TXS = get_enriched_txs(
    DAILY_PERIOD_START, DAILY_PERIOD_START + timedelta(days=1),
)
_REORGED_TX = next(tx for tx in _DAILY_TXS if tx["fromId"] == BOTH_ROLES)


@pytest.mark.integration
class TestAddressReorg:
    @pytest.fixture(scope="class", autouse=True)
    def setup_metrics(self, postgres, clean_address_metrics):  # noqa: ARG002
        _run(postgres, address_daily_metrics, DAILY_PARTITION_KEY)
        self.__class__.before = _query(postgres, "address_daily_metrics")
        _set_tx_forked(postgres, _REORGED_TX, forked=True)
        try:
            _run(postgres, address_daily_metrics, DAILY_PARTITION_KEY)
            self.__class__.after = _query(postgres, "address_daily_metrics")
            yield
        finally:
            _set_tx_forked(postgres, _REORGED_TX, forked=False)

    def test_forked_tx_is_not_counted(self):
        assert self.before[BOTH_ROLES]["sent_total_transactions"] == 1
        assert self.after[BOTH_ROLES]["sent_total_transactions"] == 0
        assert (
            self.after[_REORGED_TX["toId"]]["received_total_transactions"]
            == self.before[_REORGED_TX["toId"]]["received_total_transactions"] - 1
        )


# ---------------------------------------------------------------------------
# Hourly retention
# ---------------------------------------------------------------------------


@pytest.mark.integration
class TestAddressHourlyRetention:
    @pytest.fixture(autouse=True)
    def clean(self, postgres, clean_address_metrics):  # noqa: ARG002
        _delete_address_tables(postgres)

    def test_partition_older_than_the_retention_does_nothing(self, postgres):
        result = _run(postgres, address_hourly_metrics, HOURLY_PARTITION_KEY)
        assert result.metadata["skipped"].value is True
        assert _query(postgres, "address_hourly_metrics") == {}

    def test_window_is_cut_at_the_retention_limit(self, postgres, monkeypatch):
        # The hour has transactions at 16:00:00 and at 16:59:59. A cutoff at
        # 16:30 keeps only the transactions after it.
        cutoff = HOURLY_PERIOD_START + timedelta(minutes=30)
        monkeypatch.setattr(
            assets_module, "address_hourly_retention_cutoff", lambda: cutoff,
        )
        result = _run(postgres, address_hourly_metrics, HOURLY_PARTITION_KEY)
        assert result.metadata["skipped"].value is False

        rows = _query(postgres, "address_hourly_metrics")
        expected = expected_rows(cutoff, HOURLY_PERIOD_START + timedelta(hours=1))
        assert set(rows) == set(expected)
        for address, row in expected.items():
            _assert_row(rows[address], row)

    def test_window_that_ends_at_the_limit_is_skipped(self, postgres, monkeypatch):
        monkeypatch.setattr(
            assets_module,
            "address_hourly_retention_cutoff",
            lambda: HOURLY_PERIOD_START + timedelta(hours=1),
        )
        result = _run(postgres, address_hourly_metrics, HOURLY_PARTITION_KEY)
        assert result.metadata["skipped"].value is True

    def test_cleanup_deletes_only_old_rows(self, postgres):
        now = datetime.now(UTC).replace(minute=0, second=0, microsecond=0)
        old = now - timedelta(days=31)
        recent = now - timedelta(days=29)
        with postgres.get_connection() as conn:
            for period in (old, recent):
                conn.execute(
                    text(
                        "INSERT INTO address_hourly_metrics (address, period_start) "
                        "VALUES (:a, :p)",
                    ),
                    {"a": RECEIVER_ONLY, "p": period},
                )
            conn.commit()

        with dg.build_op_context() as context:
            delete_old_address_hourly_metrics(context, postgres=postgres)

        with postgres.get_connection() as conn:
            periods = conn.execute(
                text("SELECT period_start FROM address_hourly_metrics"),
            ).scalars().all()
        assert periods == [recent.replace(tzinfo=None)]


def test_fixture_days_are_closed():
    # The all-time tests need fixture days before the current UTC day.
    assert max(_fixture_days()) < datetime.now(UTC).date().isoformat()
