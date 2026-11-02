"""Integration tests for the temporal metrics Dagster assets.

Each asset (hourly, daily, weekly, monthly, yearly) runs aggregate SQL for a
given partition window and upserts the results into the corresponding table.
These tests execute the real asset functions against a live (containerized)
database seeded with the standard fixture data.

Run with: pytest -m integration
"""

import json
from datetime import UTC, datetime, timedelta
from decimal import Decimal
from pathlib import Path

import dagster as dg
import pytest
from sqlalchemy import text

from analytics.defs.assets import (
    all_time_metrics,
    daily_metrics,
    hourly_metrics,
    monthly_metrics,
    weekly_metrics,
    yearly_metrics,
)
from analytics.defs.resources.postgres import PostgresResource

# ---------------------------------------------------------------------------
# Partition constants derived from the seeded test data
# ---------------------------------------------------------------------------

HOURLY_PARTITION_KEY = "2025-02-05T16:00"
HOURLY_PERIOD_START = datetime(2025, 2, 5, 16, 0, 0, tzinfo=UTC)
HOURLY_PERIOD_END = HOURLY_PERIOD_START + timedelta(hours=1)

DAILY_PARTITION_KEY = "2025-02-01"
DAILY_PERIOD_START = datetime(2025, 2, 1, 0, 0, 0, tzinfo=UTC)
DAILY_PERIOD_END = DAILY_PERIOD_START + timedelta(days=1)

# 2025-02-05 is a Wednesday; weekly partitions start on Monday (day_offset=1).
WEEKLY_PARTITION_KEY = "2025-02-03"
WEEKLY_PERIOD_START = datetime(2025, 2, 3, 0, 0, 0, tzinfo=UTC)
WEEKLY_PERIOD_END = WEEKLY_PERIOD_START + timedelta(days=7)

MONTHLY_PARTITION_KEY = "2025-01"
MONTHLY_PERIOD_START = datetime(2025, 1, 1, 0, 0, 0, tzinfo=UTC)
MONTHLY_PERIOD_END = datetime(2025, 2, 1, 0, 0, 0, tzinfo=UTC)

YEARLY_PARTITION_KEY = "2024"
YEARLY_PERIOD_START = datetime(2024, 1, 1, 0, 0, 0, tzinfo=UTC)
YEARLY_PERIOD_END = datetime(2025, 1, 1, 0, 0, 0, tzinfo=UTC)


# An arbitrary period that has no fixture data — used to assert isolation.
DIFFERENT_PERIOD_START = datetime(2024, 6, 1, 0, 0, 0, tzinfo=UTC)


# ---------------------------------------------------------------------------
# Fixture data helpers
# ---------------------------------------------------------------------------

_FIXTURES = json.loads((Path(__file__).parent / "db-fixtures.json").read_text())

_ETH_USD_PRICES = {
    datetime.fromisoformat(p["timestamp"]): Decimal(p["price"])
    for p in _FIXTURES["ethUsdPrices"]
}

# The USD columns are DOUBLE PRECISION, so each stored sum is rounded.
_USD_REL_TOLERANCE = 1e-12


def _eth_usd_price_at(ts: datetime) -> Decimal | None:
    """Return the fixture ETH/USD price of the minute of ``ts``, if any."""
    return _ETH_USD_PRICES.get(ts.replace(second=0, microsecond=0))


def _wei_to_usd(wei: int, price: Decimal | None) -> Decimal | None:
    return None if price is None else wei * price * Decimal("1e-18")


def _sum_usd(values: list[Decimal | None]) -> Decimal | None:
    """Add like SQL SUM: skip NULLs, and give NULL when all are NULL."""
    present = [v for v in values if v is not None]
    return sum(present) if present else None


def _assert_usd_equal(actual: float | None, expected: Decimal | None):
    if expected is None:
        assert actual is None
    else:
        assert actual == pytest.approx(float(expected), rel=_USD_REL_TOLERANCE)


def get_enriched_txs(
    start: datetime | None = None,
    end: datetime | None = None,
) -> list[dict]:
    """Return fixture transactions in [start, end).

    Excludes forked transactions, enriched with rollup/category and per-tx
    derived fee fields (mirroring the SQL CTE).
    """
    addr_rollup = {a["address"]: a["rollup"] for a in _FIXTURES["addresses"]}
    block_by_hash = {b["hash"]: b for b in _FIXTURES["blocks"]}
    forked = {(f["blockHash"], f["hash"]) for f in _FIXTURES["transactionForks"]}

    result = []
    for tx in _FIXTURES["txs"]:
        ts = datetime.fromisoformat(tx["blockTimestamp"])

        if start is not None and ts < start:
            continue
        if end is not None and ts >= end:
            continue
        if (tx["blockHash"], tx["hash"]) in forked:
            continue

        block = block_by_hash[tx["blockHash"]]
        blob_gas_price = block["blobGasPrice"]
        rollup = addr_rollup.get(tx["fromId"])
        eth_usd_price = _eth_usd_price_at(ts)

        result.append({
            **tx,
            "rollup": rollup,
            "category": "rollup" if rollup else "other",
            "blobGasPrice": blob_gas_price,
            "blockNumber": block["number"],
            "blob_base_fee": tx["blobGasUsed"] * blob_gas_price,
            "blob_max_fee": tx["blobGasUsed"] * tx["maxFeePerBlobGas"],
            "blob_as_calldata_fee": tx["blobAsCalldataGasUsed"] * blob_gas_price,
            "blob_as_calldata_max_fee": (
                tx["blobAsCalldataGasUsed"] * tx["maxFeePerBlobGas"]
            ),
            "blob_base_fee_usd": _wei_to_usd(
                tx["blobGasUsed"] * blob_gas_price, eth_usd_price,
            ),
            "blob_as_calldata_fee_usd": _wei_to_usd(
                tx["blobAsCalldataGasUsed"] * blob_gas_price, eth_usd_price,
            ),
            "blob_max_fee_usd": _wei_to_usd(
                tx["blobGasUsed"] * tx["maxFeePerBlobGas"], eth_usd_price,
            ),
        })

    return result


def get_enriched_blocks(
    start: datetime | None = None,
    end: datetime | None = None,
) -> list[dict]:
    """Return fixture blocks whose timestamp falls in [start, end)."""
    result = []
    for block in _FIXTURES["blocks"]:
        ts = datetime.fromisoformat(block["timestamp"])
        if start is not None and ts < start:
            continue
        if end is not None and ts >= end:
            continue
        result.append(block)
    return result


def get_enriched_blobs(txs_in_window: list[dict]) -> list[dict]:
    """Return fixture blob-tx pairs for the given transactions.

    Enriched with blob size fields and the block_number at the time of the tx
    (needed for the unique-blob calculation).
    """
    tx_map = {tx["hash"]: tx for tx in txs_in_window}
    blob_map = {b["versionedHash"]: b for b in _FIXTURES["blobs"]}

    result = []
    for bot in _FIXTURES["blobsOnTxs"]:
        tx = tx_map.get(bot["txHash"])
        if tx is None:
            continue
        blob = blob_map[bot["blobHash"]]
        result.append({
            **blob,
            "blockNumber": bot["blockNumber"],
            "category": tx["category"],
            "rollup": tx["rollup"],
        })

    return result


# Pre-computed fixture data for each partition window.
# All fixture data falls within the single hourly window, so the same
# transactions/blobs appear in every larger window.
_HOUR_TXS = get_enriched_txs(HOURLY_PERIOD_START, HOURLY_PERIOD_END)
_HOUR_BLOBS = get_enriched_blobs(_HOUR_TXS)
_HOUR_BLOCKS = get_enriched_blocks(HOURLY_PERIOD_START, HOURLY_PERIOD_END)
_DAILY_TXS = get_enriched_txs(DAILY_PERIOD_START, DAILY_PERIOD_END)
_DAILY_BLOBS = get_enriched_blobs(_DAILY_TXS)
_DAILY_BLOCKS = get_enriched_blocks(DAILY_PERIOD_START, DAILY_PERIOD_END)
_WEEKLY_TXS = get_enriched_txs(WEEKLY_PERIOD_START, WEEKLY_PERIOD_END)
_WEEKLY_BLOBS = get_enriched_blobs(_WEEKLY_TXS)
_WEEKLY_BLOCKS = get_enriched_blocks(WEEKLY_PERIOD_START, WEEKLY_PERIOD_END)
_MONTHLY_TXS = get_enriched_txs(MONTHLY_PERIOD_START, MONTHLY_PERIOD_END)
_MONTHLY_BLOBS = get_enriched_blobs(_MONTHLY_TXS)
_MONTHLY_BLOCKS = get_enriched_blocks(MONTHLY_PERIOD_START, MONTHLY_PERIOD_END)
_YEARLY_TXS = get_enriched_txs(YEARLY_PERIOD_START, YEARLY_PERIOD_END)
_YEARLY_BLOBS = get_enriched_blobs(_YEARLY_TXS)
_YEARLY_BLOCKS = get_enriched_blocks(YEARLY_PERIOD_START, YEARLY_PERIOD_END)
_ALL_TXS = get_enriched_txs()
_ALL_BLOBS = get_enriched_blobs(_ALL_TXS)
_ALL_BLOCKS = get_enriched_blocks()

_ADDR_MAP = {a["address"]: a for a in _FIXTURES["addresses"]}


# ---------------------------------------------------------------------------
# Helpers / fixtures
# ---------------------------------------------------------------------------


def _run_asset(
    postgres: PostgresResource,
    partition_key: str,
    asset: dg.AssetsDefinition,
):
    """Invoke the given asset and return the MaterializeResult."""
    ctx = dg.build_asset_context(partition_key=partition_key)
    return asset(context=ctx, postgres=postgres)


def _fixture_block_timestamps() -> list[datetime]:
    return [datetime.fromisoformat(b["timestamp"]) for b in _FIXTURES["blocks"]]


def _unique_hourly_partition_keys() -> list[str]:
    seen = set()
    keys = []
    for ts in _fixture_block_timestamps():
        key = ts.replace(minute=0, second=0, microsecond=0).strftime("%Y-%m-%dT%H:%M")
        if key not in seen:
            seen.add(key)
            keys.append(key)
    return keys


def _unique_daily_partition_keys() -> list[str]:
    seen = set()
    keys = []
    for ts in _fixture_block_timestamps():
        key = ts.strftime("%Y-%m-%d")
        if key not in seen:
            seen.add(key)
            keys.append(key)
    return keys


def _unique_monthly_partition_keys() -> list[str]:
    seen = set()
    keys = []
    for ts in _fixture_block_timestamps():
        key = ts.strftime("%Y-%m")
        if key not in seen:
            seen.add(key)
            keys.append(key)
    return keys


def _unique_yearly_partition_keys() -> list[str]:
    seen = set()
    keys = []
    for ts in _fixture_block_timestamps():
        key = ts.strftime("%Y")
        if key not in seen:
            seen.add(key)
            keys.append(key)
    return keys


def _seed_hourly(postgres: PostgresResource):
    for key in _unique_hourly_partition_keys():
        _run_asset(postgres, key, hourly_metrics)


def _seed_daily(postgres: PostgresResource):
    for key in _unique_daily_partition_keys():
        _run_asset(postgres, key, daily_metrics)


def _seed_monthly(postgres: PostgresResource):
    for key in _unique_monthly_partition_keys():
        _run_asset(postgres, key, monthly_metrics)


def _seed_yearly(postgres: PostgresResource):
    for key in _unique_yearly_partition_keys():
        _run_asset(postgres, key, yearly_metrics)


def _query_metrics_table(
    postgres: PostgresResource,
    table: str,
    period_start: datetime,
) -> dict:
    """Return rows for period_start from the given table keyed by (category, rollup)."""
    with postgres.get_connection() as conn:
        rows = conn.execute(
            text(f"SELECT * FROM {table} WHERE period_start = :ps"),  # noqa: S608
            {"ps": period_start},
        ).mappings().fetchall()
    return {(row["category"], row["rollup"]): dict(row) for row in rows}


def _query_all_time_metrics(postgres: PostgresResource) -> dict:
    """Return all rows from all_time_metrics keyed by (category, rollup)."""
    with postgres.get_connection() as conn:
        rows = conn.execute(
            text("SELECT * FROM all_time_metrics"),
        ).mappings().fetchall()
    return {(row["category"], row["rollup"]): dict(row) for row in rows}


def _delete_all_tables(conn):
    conn.execute(text("DELETE FROM hourly_metrics"))
    conn.execute(text("DELETE FROM daily_metrics"))
    conn.execute(text("DELETE FROM weekly_metrics"))
    conn.execute(text("DELETE FROM monthly_metrics"))
    conn.execute(text("DELETE FROM yearly_metrics"))
    conn.execute(text("DELETE FROM all_time_metrics"))


@pytest.fixture(scope="class")
def clean_metrics(postgres):
    """Wipe all metrics tables before (and after) each test class for isolation."""
    with postgres.get_connection() as conn:
        _delete_all_tables(conn)
        conn.commit()
    yield
    with postgres.get_connection() as conn:
        _delete_all_tables(conn)
        conn.commit()


# ---------------------------------------------------------------------------
# Abstract test mixins
# ---------------------------------------------------------------------------


class _BlobMetricsMixin:
    """Mixin providing blob-metric test cases.

    Subclasses must define:
        _table       (str)        — metrics table to query
        _period_start (datetime)  — period_start value to assert against
        _txs         (list[dict]) — enriched transactions in the window
        _blobs       (list[dict]) — enriched blobs in the window
        _seed_metrics(self, postgres) — runs all prerequisite + target assets
    """

    _txs: list[dict]
    _blobs: list[dict]
    _blocks: list[dict]
    _table: str
    _period_start: datetime

    def _seed_metrics(self, postgres):
        raise NotImplementedError

    @pytest.fixture(scope="class", autouse=True)
    def setup_metrics(self, postgres, clean_metrics):  # noqa: ARG002
        """Seed metrics once for the entire test class."""
        self._seed_metrics(postgres)

    def _result(self, postgres):
        return _query_metrics_table(postgres, self._table, self._period_start)

    def test_global_metrics_exists(self, postgres):
        assert (None, None) in self._result(postgres)

    def test_category_metrics_exists(self, postgres):
        categories_in_window = {tx["category"] for tx in self._txs}
        result = self._result(postgres)
        for category in categories_in_window:
            assert (category, None) in result

    def test_rollup_metrics_exists(self, postgres):
        rollups_in_window = {tx["rollup"].lower() for tx in self._txs if tx["rollup"]}
        result = self._result(postgres)
        for rollup in rollups_in_window:
            assert (None, rollup) in result

    def test_no_extra_rollup_metrics_created(self, postgres):
        # category=None rows: 1 global + 1 per distinct rollup in the window
        n_distinct_rollups = len({tx["rollup"] for tx in self._txs if tx["rollup"]})
        result = self._result(postgres)
        assert sum(1 for cat, _ in result if cat is None) == 1 + n_distinct_rollups

    def test_no_extra_category_metrics_created(self, postgres):
        # rollup=None rows: 1 global + 1 per distinct category present in the window
        n_distinct_categories = len({tx["category"] for tx in self._txs})
        result = self._result(postgres)
        assert sum(1 for _, roll in result if roll is None) == 1 + n_distinct_categories

    def test_no_metrics_created_for_other_periods(self, postgres):
        assert _query_metrics_table(postgres, self._table, DIFFERENT_PERIOD_START) == {}

    def test_total_blobs(self, postgres):
        expected = len(self._blobs)
        assert self._result(postgres)[(None, None)]["total_blobs"] == expected

    def test_total_unique_blobs(self, postgres):
        expected = sum(
            1 for b in self._blobs if b["firstBlockNumber"] == b["blockNumber"]
        )
        assert self._result(postgres)[(None, None)]["total_unique_blobs"] == expected

    def test_total_blob_size(self, postgres):
        expected = sum(b["size"] for b in self._blobs)
        assert self._result(postgres)[(None, None)]["total_blob_size"] == expected

    def test_total_blob_usage_size(self, postgres):
        expected = sum(b["usageSize"] for b in self._blobs)
        assert self._result(postgres)[(None, None)]["total_blob_usage_size"] == expected

    def test_avg_blob_usage_size(self, postgres):
        expected = sum(b["usageSize"] for b in self._blobs) / len(self._blobs)
        assert self._result(postgres)[(None, None)]["avg_blob_usage_size"] == expected


class _TxMetricsMixin:
    """Mixin providing tx-metric test cases.

    Subclasses must define:
        _table        (str)        — metrics table to query
        _period_start (datetime)   — period_start value to assert against
        _txs          (list[dict]) — enriched transactions in the window
        _seed_metrics(self, postgres) — runs all prerequisite + target assets
    """

    _txs: list[dict]
    _blocks: list[dict]
    _table: str
    _period_start: datetime

    def _seed_metrics(self, postgres):
        raise NotImplementedError

    @pytest.fixture(scope="class", autouse=True)
    def setup_metrics(self, postgres, clean_metrics):  # noqa: ARG002
        """Seed metrics once for the entire test class."""
        self._seed_metrics(postgres)

    def _result(self, postgres):
        return _query_metrics_table(postgres, self._table, self._period_start)

    def test_global_metrics_exists(self, postgres):
        assert (None, None) in self._result(postgres)

    def test_category_metrics_exists(self, postgres):
        categories_in_window = {tx["category"] for tx in self._txs}
        result = self._result(postgres)
        for category in categories_in_window:
            assert (category, None) in result

    def test_rollup_metrics_exists(self, postgres):
        rollups_in_window = {tx["rollup"].lower() for tx in self._txs if tx["rollup"]}
        result = self._result(postgres)
        for rollup in rollups_in_window:
            assert (None, rollup) in result

    def test_no_extra_rollup_metrics_created(self, postgres):
        n_distinct_rollups = len({tx["rollup"] for tx in self._txs if tx["rollup"]})
        result = self._result(postgres)
        assert sum(1 for cat, _ in result if cat is None) == 1 + n_distinct_rollups

    def test_no_extra_category_metrics_created(self, postgres):
        # rollup=None rows: 1 global + 1 per distinct category present in the window
        n_distinct_categories = len({tx["category"] for tx in self._txs})
        result = self._result(postgres)
        assert sum(1 for _, roll in result if roll is None) == 1 + n_distinct_categories

    def test_no_metrics_created_for_other_periods(self, postgres):
        assert _query_metrics_table(postgres, self._table, DIFFERENT_PERIOD_START) == {}

    def test_global_only_metrics_are_null_for_non_global_rows(self, postgres):
        global_only_fields = [
            "avg_blob_gas_price",
            "total_blob_gas_price",
            "total_blocks",
        ]
        for (cat, rollup), row in self._result(postgres).items():
            if (cat, rollup) != (None, None):
                for field in global_only_fields:
                    assert row[field] is None, (
                        f"{field} should be NULL for "
                        f"(category={cat!r}, rollup={rollup!r})"
                    )

    def test_total_transactions(self, postgres):
        expected = len(self._txs)
        assert self._result(postgres)[(None, None)]["total_transactions"] == expected

    def test_total_blocks(self, postgres):
        expected = len({tx["blockNumber"] for tx in self._txs})
        assert self._result(postgres)[(None, None)]["total_blocks"] == expected

    def test_avg_blob_gas_price(self, postgres):
        expected = sum(b["blobGasPrice"] for b in self._blocks) / len(self._blocks)
        assert self._result(postgres)[(None, None)]["avg_blob_gas_price"] == expected

    def test_total_blob_gas_price(self, postgres):
        expected = sum(b["blobGasPrice"] for b in self._blocks)
        assert self._result(postgres)[(None, None)]["total_blob_gas_price"] == expected

    def test_avg_blob_base_fee(self, postgres):
        expected = sum(tx["blob_base_fee"] for tx in self._txs) / len(self._txs)
        assert self._result(postgres)[(None, None)]["avg_blob_base_fee"] == expected

    def test_total_blob_base_fee(self, postgres):
        expected = sum(tx["blob_base_fee"] for tx in self._txs)
        assert self._result(postgres)[(None, None)]["total_blob_base_fee"] == expected

    def test_total_unique_senders(self, postgres):
        expected = len({
            tx["fromId"]
            for tx in self._txs
            if _ADDR_MAP.get(tx["fromId"], {}).get("firstBlockNumberAsSender")
            == tx["blockNumber"]
        })
        assert self._result(postgres)[(None, None)]["total_unique_senders"] == expected

    def test_total_unique_receivers(self, postgres):
        expected = len({
            tx["toId"]
            for tx in self._txs
            if _ADDR_MAP.get(tx["toId"], {}).get("firstBlockNumberAsReceiver")
            == tx["blockNumber"]
        })
        assert (
            self._result(postgres)[(None, None)]["total_unique_receivers"] == expected
        )

    def test_total_blob_gas_used(self, postgres):
        expected = sum(tx["blobGasUsed"] for tx in self._txs)
        assert self._result(postgres)[(None, None)]["total_blob_gas_used"] == expected

    def test_total_blob_as_calldata_gas_used(self, postgres):
        expected = sum(tx["blobAsCalldataGasUsed"] for tx in self._txs)
        assert (
            self._result(postgres)[(None, None)]["total_blob_as_calldata_gas_used"]
            == expected
        )

    def test_avg_blob_max_fee(self, postgres):
        expected = sum(tx["blob_max_fee"] for tx in self._txs) / len(self._txs)
        assert self._result(postgres)[(None, None)]["avg_blob_max_fee"] == expected

    def test_total_blob_max_fee(self, postgres):
        expected = sum(tx["blob_max_fee"] for tx in self._txs)
        assert self._result(postgres)[(None, None)]["total_blob_max_fee"] == expected

    def test_avg_blob_as_calldata_fee(self, postgres):
        expected = sum(tx["blob_as_calldata_fee"] for tx in self._txs) / len(self._txs)
        assert (
            self._result(postgres)[(None, None)]["avg_blob_as_calldata_fee"] == expected
        )

    def test_total_blob_as_calldata_fee(self, postgres):
        expected = sum(tx["blob_as_calldata_fee"] for tx in self._txs)
        assert (
            self._result(postgres)[(None, None)]["total_blob_as_calldata_fee"]
            == expected
        )

    def test_avg_blob_as_calldata_max_fee(self, postgres):
        expected = (
            sum(tx["blob_as_calldata_max_fee"] for tx in self._txs) / len(self._txs)
        )
        assert (
            self._result(postgres)[(None, None)]["avg_blob_as_calldata_max_fee"]
            == expected
        )

    def test_total_blob_as_calldata_max_fee(self, postgres):
        expected = sum(tx["blob_as_calldata_max_fee"] for tx in self._txs)
        assert (
            self._result(postgres)[(None, None)]["total_blob_as_calldata_max_fee"]
            == expected
        )

    def test_avg_max_blob_gas_fee(self, postgres):
        expected = sum(tx["maxFeePerBlobGas"] for tx in self._txs) / len(self._txs)
        assert self._result(postgres)[(None, None)]["avg_max_blob_gas_fee"] == expected

    def test_total_max_blob_gas_fee(self, postgres):
        expected = sum(tx["maxFeePerBlobGas"] for tx in self._txs)
        assert (
            self._result(postgres)[(None, None)]["total_max_blob_gas_fee"] == expected
        )

    @pytest.mark.parametrize(
        ("column", "tx_field"),
        [
            ("total_blob_base_fee_usd", "blob_base_fee_usd"),
            ("total_blob_as_calldata_fee_usd", "blob_as_calldata_fee_usd"),
            ("total_blob_max_fee_usd", "blob_max_fee_usd"),
        ],
    )
    def test_total_fees_usd(self, postgres, column, tx_field):
        result = self._result(postgres)
        for (cat, rollup), row in result.items():
            txs = [
                tx for tx in self._txs
                if (cat is None or tx["category"] == cat)
                and (rollup is None or (tx["rollup"] or "").lower() == rollup)
            ]
            _assert_usd_equal(row[column], _sum_usd([tx[tx_field] for tx in txs]))


class _AllTimeBlobMetricsMixin(_BlobMetricsMixin):
    def _result(self, postgres):
        return _query_all_time_metrics(postgres)

    def test_no_metrics_created_for_other_periods(self, postgres):
        pass  # all_time_metrics has no period dimension


class _AllTimeTxMetricsMixin(_TxMetricsMixin):
    def _result(self, postgres):
        return _query_all_time_metrics(postgres)

    def test_no_metrics_created_for_other_periods(self, postgres):
        pass  # all_time_metrics has no period dimension


# ---------------------------------------------------------------------------
# Hourly metric tests
# ---------------------------------------------------------------------------


@pytest.mark.integration
class TestHourlyBlobMetricsCalculation(_BlobMetricsMixin):
    _table = "hourly_metrics"
    _period_start = HOURLY_PERIOD_START
    _txs = _HOUR_TXS
    _blobs = _HOUR_BLOBS
    _blocks = _HOUR_BLOCKS

    def _seed_metrics(self, postgres):
        _run_asset(postgres, HOURLY_PARTITION_KEY, hourly_metrics)


@pytest.mark.integration
class TestHourlyTxMetricsCalculation(_TxMetricsMixin):
    _table = "hourly_metrics"
    _period_start = HOURLY_PERIOD_START
    _txs = _HOUR_TXS
    _blocks = _HOUR_BLOCKS

    def _seed_metrics(self, postgres):
        _run_asset(postgres, HOURLY_PARTITION_KEY, hourly_metrics)


# ---------------------------------------------------------------------------
# Daily metric tests
# ---------------------------------------------------------------------------


@pytest.mark.integration
class TestDailyBlobMetricsCalculation(_BlobMetricsMixin):
    _table = "daily_metrics"
    _period_start = DAILY_PERIOD_START
    _txs = _DAILY_TXS
    _blobs = _DAILY_BLOBS
    _blocks = _DAILY_BLOCKS

    def _seed_metrics(self, postgres):
        _seed_hourly(postgres)
        _run_asset(postgres, DAILY_PARTITION_KEY, daily_metrics)


@pytest.mark.integration
class TestDailyTxMetricsCalculation(_TxMetricsMixin):
    _table = "daily_metrics"
    _period_start = DAILY_PERIOD_START
    _txs = _DAILY_TXS
    _blocks = _DAILY_BLOCKS

    def _seed_metrics(self, postgres):
        _seed_hourly(postgres)
        _run_asset(postgres, DAILY_PARTITION_KEY, daily_metrics)


# ---------------------------------------------------------------------------
# Weekly metric tests
# ---------------------------------------------------------------------------


@pytest.mark.integration
class TestWeeklyBlobMetricsCalculation(_BlobMetricsMixin):
    _table = "weekly_metrics"
    _period_start = WEEKLY_PERIOD_START
    _txs = _WEEKLY_TXS
    _blobs = _WEEKLY_BLOBS
    _blocks = _WEEKLY_BLOCKS

    def _seed_metrics(self, postgres):
        _seed_hourly(postgres)
        _seed_daily(postgres)
        _run_asset(postgres, WEEKLY_PARTITION_KEY, weekly_metrics)


@pytest.mark.integration
class TestWeeklyTxMetricsCalculation(_TxMetricsMixin):
    _table = "weekly_metrics"
    _period_start = WEEKLY_PERIOD_START
    _txs = _WEEKLY_TXS
    _blocks = _WEEKLY_BLOCKS

    def _seed_metrics(self, postgres):
        _seed_hourly(postgres)
        _seed_daily(postgres)
        _run_asset(postgres, WEEKLY_PARTITION_KEY, weekly_metrics)


# ---------------------------------------------------------------------------
# Monthly metric tests
# ---------------------------------------------------------------------------


@pytest.mark.integration
class TestMonthlyBlobMetricsCalculation(_BlobMetricsMixin):
    _table = "monthly_metrics"
    _period_start = MONTHLY_PERIOD_START
    _txs = _MONTHLY_TXS
    _blobs = _MONTHLY_BLOBS
    _blocks = _MONTHLY_BLOCKS

    def _seed_metrics(self, postgres):
        _seed_hourly(postgres)
        _seed_daily(postgres)
        _run_asset(postgres, MONTHLY_PARTITION_KEY, monthly_metrics)


@pytest.mark.integration
class TestMonthlyTxMetricsCalculation(_TxMetricsMixin):
    _table = "monthly_metrics"
    _period_start = MONTHLY_PERIOD_START
    _txs = _MONTHLY_TXS
    _blocks = _MONTHLY_BLOCKS

    def _seed_metrics(self, postgres):
        _seed_hourly(postgres)
        _seed_daily(postgres)
        _run_asset(postgres, MONTHLY_PARTITION_KEY, monthly_metrics)


# ---------------------------------------------------------------------------
# Yearly metric tests
# ---------------------------------------------------------------------------


@pytest.mark.integration
class TestYearlyBlobMetricsCalculation(_BlobMetricsMixin):
    _table = "yearly_metrics"
    _period_start = YEARLY_PERIOD_START
    _txs = _YEARLY_TXS
    _blobs = _YEARLY_BLOBS
    _blocks = _YEARLY_BLOCKS

    def _seed_metrics(self, postgres):
        _seed_hourly(postgres)
        _seed_daily(postgres)
        _seed_monthly(postgres)
        _run_asset(postgres, YEARLY_PARTITION_KEY, yearly_metrics)


@pytest.mark.integration
class TestYearlyTxMetricsCalculation(_TxMetricsMixin):
    _table = "yearly_metrics"
    _period_start = YEARLY_PERIOD_START
    _txs = _YEARLY_TXS
    _blocks = _YEARLY_BLOCKS

    def _seed_metrics(self, postgres):
        _seed_hourly(postgres)
        _seed_daily(postgres)
        _seed_monthly(postgres)
        _run_asset(postgres, YEARLY_PARTITION_KEY, yearly_metrics)


# ---------------------------------------------------------------------------
# All-time metric tests
# ---------------------------------------------------------------------------


@pytest.mark.integration
class TestAllTimeBlobMetricsCalculation(_AllTimeBlobMetricsMixin):
    _table = "all_time_metrics"
    _txs = _ALL_TXS
    _blobs = _ALL_BLOBS
    _blocks = _ALL_BLOCKS

    def _seed_metrics(self, postgres):
        _seed_hourly(postgres)
        _seed_daily(postgres)
        _seed_monthly(postgres)
        _seed_yearly(postgres)
        all_time_metrics(postgres=postgres)


@pytest.mark.integration
class TestAllTimeTxMetricsCalculation(_AllTimeTxMetricsMixin):
    _table = "all_time_metrics"
    _txs = _ALL_TXS
    _blobs = _ALL_BLOBS
    _blocks = _ALL_BLOCKS

    def _seed_metrics(self, postgres):
        _seed_hourly(postgres)
        _seed_daily(postgres)
        _seed_monthly(postgres)
        _seed_yearly(postgres)
        all_time_metrics(postgres=postgres)


# ---------------------------------------------------------------------------
# USD fee tests
# ---------------------------------------------------------------------------

# The fixtures have no ETH/USD price for the minute of this transaction.
_NO_PRICE_PARTITION_KEY = "2024-01-01T00:00"
_NO_PRICE_PERIOD_START = datetime(2024, 1, 1, 0, 0, 0, tzinfo=UTC)
_USD_COLUMNS = (
    "total_blob_base_fee_usd",
    "total_blob_as_calldata_fee_usd",
    "total_blob_max_fee_usd",
)


@pytest.mark.integration
class TestUsdFeesWithoutPrice:
    """The USD fees are NULL, not 0, when no ETH/USD price is available."""

    @pytest.fixture(scope="class", autouse=True)
    def setup_metrics(self, postgres, clean_metrics):  # noqa: ARG002
        _run_asset(postgres, _NO_PRICE_PARTITION_KEY, hourly_metrics)

    def test_usd_fees_are_null(self, postgres):
        result = _query_metrics_table(
            postgres, "hourly_metrics", _NO_PRICE_PERIOD_START,
        )
        assert result
        for row in result.values():
            assert row["total_blob_base_fee"] > 0
            for column in _USD_COLUMNS:
                assert row[column] is None


# ---------------------------------------------------------------------------
# Reorg re-aggregation tests
# ---------------------------------------------------------------------------

# BASE has a single transaction in the hourly window and none elsewhere on
# that day, so forking it leaves no BASE data in the hour or the day.
_REORGED_ROLLUP = "BASE"
_REORGED_TX = next(tx for tx in _HOUR_TXS if tx["rollup"] == _REORGED_ROLLUP)
_REORG_DAILY_PARTITION_KEY = HOURLY_PERIOD_START.strftime("%Y-%m-%d")
_REORG_DAILY_PERIOD_START = HOURLY_PERIOD_START.replace(hour=0)
_REORG_MONTHLY_PARTITION_KEY = HOURLY_PERIOD_START.strftime("%Y-%m")
_REORG_YEARLY_PARTITION_KEY = HOURLY_PERIOD_START.strftime("%Y")


def _set_tx_forked(postgres: PostgresResource, tx: dict, *, forked: bool):
    params = {"block_hash": tx["blockHash"], "hash": tx["hash"]}
    with postgres.get_connection() as conn:
        if forked:
            conn.execute(
                text(
                    "INSERT INTO transaction_fork (block_hash, hash) "
                    "VALUES (:block_hash, :hash)",
                ),
                params,
            )
        else:
            conn.execute(
                text(
                    "DELETE FROM transaction_fork "
                    "WHERE block_hash = :block_hash AND hash = :hash",
                ),
                params,
            )
        conn.commit()


@pytest.mark.integration
class TestReorgReaggregation:
    """Re-aggregating a window after a reorg must drop groups left without data."""

    @pytest.fixture(scope="class", autouse=True)
    def setup_metrics(self, postgres, clean_metrics):  # noqa: ARG002
        _seed_hourly(postgres)
        _seed_daily(postgres)
        _seed_monthly(postgres)
        _seed_yearly(postgres)
        all_time_metrics(postgres=postgres)
        self.__class__.all_time_before = _query_all_time_metrics(postgres)

        # Re-run the whole chain for the reorged window, as the catch-up
        # schedule and eager automation would.
        _set_tx_forked(postgres, _REORGED_TX, forked=True)
        try:
            _run_asset(postgres, HOURLY_PARTITION_KEY, hourly_metrics)
            _run_asset(postgres, _REORG_DAILY_PARTITION_KEY, daily_metrics)
            _run_asset(postgres, _REORG_MONTHLY_PARTITION_KEY, monthly_metrics)
            _run_asset(postgres, _REORG_YEARLY_PARTITION_KEY, yearly_metrics)
            all_time_metrics(postgres=postgres)
            yield
        finally:
            _set_tx_forked(postgres, _REORGED_TX, forked=False)

    def test_reorged_rollup_removed_from_hourly(self, postgres):
        result = _query_metrics_table(postgres, "hourly_metrics", HOURLY_PERIOD_START)
        assert (None, _REORGED_ROLLUP.lower()) not in result

    def test_reorged_rollup_removed_from_daily(self, postgres):
        result = _query_metrics_table(
            postgres, "daily_metrics", _REORG_DAILY_PERIOD_START,
        )
        assert (None, _REORGED_ROLLUP.lower()) not in result

    def test_hourly_global_transactions_exclude_reorged_tx(self, postgres):
        result = _query_metrics_table(postgres, "hourly_metrics", HOURLY_PERIOD_START)
        assert result[(None, None)]["total_transactions"] == len(_HOUR_TXS) - 1

    def test_all_time_rollup_transactions_exclude_reorged_tx(self, postgres):
        key = (None, _REORGED_ROLLUP.lower())
        before = self.all_time_before[key]["total_transactions"]
        after = _query_all_time_metrics(postgres)[key]["total_transactions"]
        assert after == before - 1
