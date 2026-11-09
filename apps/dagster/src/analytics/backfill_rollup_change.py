"""Launch the metrics backfill that a change of ``address.rollup`` needs.

The metrics store the rollup of each row, so the periods that were already
aggregated keep the old attribution until they are aggregated again. This
command finds the first transaction of the changed addresses and prints the
partitions to re-aggregate. With ``--launch``, it also starts one backfill of
all the metrics levels from that point to the latest partition. With
``--wait``, it stays until the backfill ends and exits with 1 if it did not
succeed.

Usage:
    python -m analytics.backfill_rollup_change --migration <migration.sql>
    python -m analytics.backfill_rollup_change --address 0x... --launch [--wait]
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import TYPE_CHECKING, Any

import dagster as dg
from sqlalchemy import text
from sqlalchemy.engine import make_url

from analytics.defs.assets import (
    daily_partitions,
    hourly_partitions,
    monthly_partitions,
    weekly_partitions,
    yearly_partitions,
)
from analytics.defs.resources.postgres import PostgresResource

if TYPE_CHECKING:
    from collections.abc import Sequence

    from sqlalchemy.engine import Connection

# In upstream-to-downstream order. Dagster uses the dependencies of the assets
# to order the runs. all_time_metrics has no partitions.
ASSET_PARTITIONS: dict[str, dg.TimeWindowPartitionsDefinition | None] = {
    "hourly_metrics": hourly_partitions,
    "daily_metrics": daily_partitions,
    "weekly_metrics": weekly_partitions,
    "monthly_metrics": monthly_partitions,
    "yearly_metrics": yearly_partitions,
    "all_time_metrics": None,
}

DEFAULT_GRAPHQL_URL = "http://localhost:3003/graphql"
GRAPHQL_TIMEOUT_SECONDS = 60
MAX_ERROR_BODY_LENGTH = 1000
POLL_INTERVAL_SECONDS = 30
# A backfill can take hours. Allow a short outage of the API or of a
# port-forward, but not an API that stays down.
MAX_CONSECUTIVE_POLL_ERRORS = 5

SUCCESS_STATUS = "COMPLETED_SUCCESS"
# COMPLETED is deprecated and does not say if the runs succeeded.
FINAL_STATUSES = frozenset(
    {SUCCESS_STATUS, "COMPLETED", "COMPLETED_FAILED", "FAILED", "CANCELED"},
)

LAUNCH_BACKFILL_MUTATION = """
mutation LaunchRollupChangeBackfill($params: LaunchBackfillParams!) {
  launchPartitionBackfill(backfillParams: $params) {
    __typename
    ... on LaunchBackfillSuccess { backfillId }
    ... on Error { message }
  }
}
"""

BACKFILL_STATUS_QUERY = """
query RollupChangeBackfillStatus($backfillId: String!) {
  partitionBackfillOrError(backfillId: $backfillId) {
    __typename
    ... on PartitionBackfill { status }
    ... on Error { message }
  }
}
"""

_ADDRESS = re.compile(r"^0x[0-9a-f]{40}$")
_ADDRESS_IN_SQL = re.compile(r"(?<![0-9a-zA-Z])0x[0-9a-fA-F]{40}(?![0-9a-zA-Z])")
_SQL_LINE_COMMENT = re.compile(r"--.*$", re.MULTILINE)

_ADDRESS_STATES_SQL = text("""
    SELECT
      a AS address,
      ad.rollup::text AS rollup,
      (SELECT MIN(block_timestamp) FROM transaction WHERE from_id = a) AS first_tx
    FROM unnest(CAST(:addresses AS text[])) AS a
      LEFT JOIN address ad ON ad.address = a
    ORDER BY a
""")


class BackfillError(Exception):
    """An error to show to the user without a traceback."""


@dataclass(frozen=True)
class AddressState:
    address: str
    rollup: str | None
    first_tx: datetime | None


def normalize_addresses(raw_addresses: Sequence[str]) -> list[str]:
    addresses = sorted({address.strip().lower() for address in raw_addresses})
    invalid = [address for address in addresses if not _ADDRESS.match(address)]
    if invalid:
        msg = f"Invalid addresses: {', '.join(invalid)}"
        raise BackfillError(msg)
    return addresses


def read_migration_addresses(path: Path) -> list[str]:
    """Return the addresses of a SQL file, ignoring the ones in line comments."""
    try:
        sql = path.read_text()
    except OSError as error:
        msg = f"Cannot read {path}: {error.strerror}"
        raise BackfillError(msg) from error
    return _ADDRESS_IN_SQL.findall(_SQL_LINE_COMMENT.sub("", sql))


def sqlalchemy_url(database_url: str) -> str:
    """Remove the Prisma ``schema`` parameter, which libpq does not accept."""
    url = make_url(database_url).difference_update_query(["schema"])
    return url.render_as_string(hide_password=False)


def fetch_address_states(
    conn: Connection,
    addresses: Sequence[str],
) -> list[AddressState]:
    rows = conn.execute(_ADDRESS_STATES_SQL, {"addresses": list(addresses)})
    return [
        AddressState(
            address=row.address,
            rollup=row.rollup,
            first_tx=row.first_tx.replace(tzinfo=UTC) if row.first_tx else None,
        )
        for row in rows
    ]


def find_backfill_start(states: Sequence[AddressState]) -> datetime | None:
    first_txs = [state.first_tx for state in states if state.first_tx is not None]
    return min(first_txs, default=None)


def partition_range(
    partitions_def: dg.TimeWindowPartitionsDefinition,
    start: datetime,
) -> tuple[str, str]:
    """Return the partition that contains ``start`` and the latest partition."""
    first_key = partitions_def.get_first_partition_key()
    last_key = partitions_def.get_last_partition_key()
    if first_key is None or last_key is None:
        msg = "The metrics partitions have not started yet"
        raise BackfillError(msg)

    if start < partitions_def.time_window_for_partition_key(first_key).start:
        return first_key, last_key

    return partitions_def.get_partition_key_for_timestamp(start.timestamp()), last_key


def build_partitions_by_assets(start: datetime) -> list[dict[str, Any]]:
    """Return the ``partitionsByAssets`` value of the backfill mutation."""
    selection: list[dict[str, Any]] = []
    for asset_name, partitions_def in ASSET_PARTITIONS.items():
        partitions = None
        if partitions_def is not None:
            first_key, last_key = partition_range(partitions_def, start)
            partitions = {"range": {"start": first_key, "end": last_key}}
        selection.append({"assetKey": {"path": [asset_name]}, "partitions": partitions})
    return selection


def _call_graphql(
    graphql_url: str,
    query: str,
    variables: dict[str, Any],
) -> dict[str, Any]:
    """Run a GraphQL operation and return its ``data``."""
    if not graphql_url.startswith(("http://", "https://")):
        msg = f"The Dagster GraphQL URL must use http or https: {graphql_url}"
        raise BackfillError(msg)

    request = urllib.request.Request(  # noqa: S310 (the scheme is checked above)
        graphql_url,
        data=json.dumps({"query": query, "variables": variables}).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(  # noqa: S310
            request,
            timeout=GRAPHQL_TIMEOUT_SECONDS,
        ) as response:
            body = json.load(response)
    except urllib.error.HTTPError as error:
        detail = error.read().decode(errors="replace")[:MAX_ERROR_BODY_LENGTH]
        msg = f"The Dagster API at {graphql_url} returned {error.code}: {detail}"
        raise BackfillError(msg) from error
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as error:
        msg = f"Cannot call the Dagster API at {graphql_url}: {error}"
        raise BackfillError(msg) from error

    if body.get("errors"):
        messages = "; ".join(error.get("message", "") for error in body["errors"])
        msg = f"The Dagster API returned errors: {messages}"
        raise BackfillError(msg)

    return body["data"]


def launch_backfill(
    graphql_url: str,
    selection: list[dict[str, Any]],
    addresses: Sequence[str],
) -> str:
    """Start the backfill and return its ID."""
    data = _call_graphql(
        graphql_url,
        LAUNCH_BACKFILL_MUTATION,
        {
            "params": {
                "partitionsByAssets": selection,
                "title": "Rollup change",
                "description": ", ".join(addresses),
            },
        },
    )
    result = data["launchPartitionBackfill"]
    if result["__typename"] != "LaunchBackfillSuccess":
        detail = result.get("message", "no details")
        msg = f"The backfill was not launched ({result['__typename']}): {detail}"
        raise BackfillError(msg)
    return result["backfillId"]


def fetch_backfill_status(graphql_url: str, backfill_id: str) -> str:
    data = _call_graphql(
        graphql_url,
        BACKFILL_STATUS_QUERY,
        {"backfillId": backfill_id},
    )
    result = data["partitionBackfillOrError"]
    if result["__typename"] != "PartitionBackfill":
        detail = result.get("message", "no details")
        msg = f"Cannot read backfill {backfill_id} ({result['__typename']}): {detail}"
        raise BackfillError(msg)
    return result["status"]


def wait_for_backfill(graphql_url: str, backfill_id: str) -> None:
    """Return when the backfill succeeds, and raise if it ends in another way."""
    last_status = None
    poll_errors = 0
    while True:
        try:
            status = fetch_backfill_status(graphql_url, backfill_id)
        except BackfillError as error:
            poll_errors += 1
            if poll_errors >= MAX_CONSECUTIVE_POLL_ERRORS:
                msg = (
                    f"Stopped waiting, but backfill {backfill_id} may still be "
                    f"running: {error}"
                )
                raise BackfillError(msg) from error
        else:
            poll_errors = 0
            if status != last_status:
                print(f"Backfill status: {status}", flush=True)
                last_status = status
            if status == SUCCESS_STATUS:
                return
            if status in FINAL_STATUSES:
                msg = f"Backfill {backfill_id} ended with status {status}"
                raise BackfillError(msg)
        time.sleep(POLL_INTERVAL_SECONDS)


def backfill_url(graphql_url: str, backfill_id: str) -> str:
    base_url = graphql_url.removesuffix("/").removesuffix("/graphql")
    return f"{base_url}/runs/b/{backfill_id}"


def _print_states(states: Sequence[AddressState]) -> None:
    print("Addresses:")
    for state in states:
        first_tx = state.first_tx.isoformat() if state.first_tx else "no transactions"
        print(f"  {state.address}  {state.rollup or 'unlabelled':<14}  {first_tx}")


def _print_selection(selection: list[dict[str, Any]]) -> None:
    print("Partitions:")
    for item in selection:
        asset_name = item["assetKey"]["path"][0]
        partitions = item["partitions"]
        partitions_def = ASSET_PARTITIONS[asset_name]
        if partitions is None or partitions_def is None:
            print(f"  {asset_name:<17} full refresh")
            continue
        first_key, last_key = partitions["range"]["start"], partitions["range"]["end"]
        count = len(
            partitions_def.get_partition_keys_in_range(
                dg.PartitionKeyRange(first_key, last_key),
            ),
        )
        print(f"  {asset_name:<17} {first_key} to {last_key} (partitions: {count})")


def _parse_args(argv: Sequence[str] | None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        prog="python -m analytics.backfill_rollup_change",
        description=(
            "Re-aggregate the metrics after a change of address.rollup. "
            "Without --launch, it only prints what the backfill would cover."
        ),
    )
    parser.add_argument(
        "--address",
        action="append",
        default=[],
        help="address whose rollup changed (repeatable)",
    )
    parser.add_argument(
        "--migration",
        action="append",
        default=[],
        type=Path,
        help="SQL migration to read the addresses from (repeatable)",
    )
    parser.add_argument(
        "--launch",
        action="store_true",
        help="start the backfill",
    )
    parser.add_argument(
        "--wait",
        action="store_true",
        help="with --launch, wait for the backfill and fail if it does not succeed",
    )
    parser.add_argument(
        "--allow-unlabelled",
        action="store_true",
        help="launch even if some addresses have no rollup",
    )
    parser.add_argument(
        "--graphql-url",
        default=os.getenv("DAGSTER_GRAPHQL_URL", DEFAULT_GRAPHQL_URL),
        help="Dagster GraphQL endpoint (default: $DAGSTER_GRAPHQL_URL or %(default)s)",
    )
    args = parser.parse_args(argv)
    if args.wait and not args.launch:
        parser.error("--wait requires --launch")
    return args


def _collect_addresses(args: argparse.Namespace) -> list[str]:
    raw_addresses = list(args.address)
    for migration in args.migration:
        addresses = read_migration_addresses(migration)
        if not addresses:
            msg = f"{migration} has no addresses"
            raise BackfillError(msg)
        raw_addresses.extend(addresses)
    if not raw_addresses:
        msg = "Pass at least one --address or --migration"
        raise BackfillError(msg)
    return normalize_addresses(raw_addresses)


def _run(args: argparse.Namespace) -> None:
    addresses = _collect_addresses(args)

    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        msg = "DATABASE_URL is not set"
        raise BackfillError(msg)

    postgres = PostgresResource(connection_url=sqlalchemy_url(database_url))
    with postgres.get_connection() as conn:
        states = fetch_address_states(conn, addresses)

    _print_states(states)

    start = find_backfill_start(states)
    if start is None:
        print("The addresses have sent no transactions: no backfill is needed.")
        return

    selection = build_partitions_by_assets(start)
    _print_selection(selection)

    unlabelled = [state.address for state in states if state.rollup is None]
    if unlabelled:
        print(
            f"Warning: addresses without a rollup: {len(unlabelled)}. If the migration "
            "has not run yet, a backfill would keep the old attribution.",
        )

    if not args.launch:
        print("Dry run: pass --launch to start this backfill.")
        return

    if unlabelled and not args.allow_unlabelled:
        msg = "Not launched. Pass --allow-unlabelled if these addresses are correct."
        raise BackfillError(msg)

    backfill_id = launch_backfill(args.graphql_url, selection, addresses)
    print(f"Launched backfill {backfill_id}")
    print(f"Progress: {backfill_url(args.graphql_url, backfill_id)}", flush=True)

    if args.wait:
        wait_for_backfill(args.graphql_url, backfill_id)


def main(argv: Sequence[str] | None = None) -> int:
    args = _parse_args(argv)
    try:
        _run(args)
    except BackfillError as error:
        print(f"Error: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
