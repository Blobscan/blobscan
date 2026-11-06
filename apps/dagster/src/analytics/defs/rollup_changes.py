"""Re-aggregate the metrics after the rollup of an address changes.

The hourly SQL reads ``address.rollup`` when it runs, and the metrics tables
store the rollup of each row. A migration that sets the rollup of existing
addresses (e.g. a new batcher of a rollup) does not change the metrics that
were already aggregated: the blobs of those addresses stay in the "other"
category until their partitions are aggregated again.

This sensor keeps a snapshot of the labeled addresses in its cursor. When the
rollup of an address changes, it launches a backfill of every metrics level,
from the first hour in which that address sent a transaction until now.
"""

from __future__ import annotations

import json
from datetime import UTC, datetime, timedelta
from typing import TYPE_CHECKING

import dagster as dg

# Not exported from the top-level dagster package (1.13).
# RunRequest.for_asset_graph_subset takes it to launch a backfill.
from dagster._core.definitions.assets.graph.asset_graph_subset import (
    AssetGraphSubset,
)
from sqlalchemy import bindparam, text

from analytics.defs.alerts import send_alert
from analytics.defs.assets import (
    daily_metrics,
    hourly_metrics,
    hourly_partitions,
    monthly_metrics,
    weekly_metrics,
    yearly_metrics,
)
from analytics.defs.resources.postgres import PostgresResource

if TYPE_CHECKING:
    from collections.abc import Mapping

ROLLUP_SNAPSHOT_SQL = text(
    "SELECT address, rollup::text FROM address WHERE rollup IS NOT NULL",
)

FIRST_SENT_AT_SQL = text(
    """
    SELECT MIN(b.timestamp)
    FROM address a
      JOIN block b ON b.number = a.first_block_number_as_sender
    WHERE a.address IN :addresses
    """,
).bindparams(bindparam("addresses", expanding=True))

# The live schedule re-aggregates the current hour and the catch-up schedule
# the previous ones, so a change that only affects these hours (e.g. the
# indexer inserting the address of a new batcher) needs no backfill.
LIVE_HOURS = 2

BACKFILL_ASSETS = (
    hourly_metrics,
    daily_metrics,
    weekly_metrics,
    monthly_metrics,
    yearly_metrics,
)

BACKFILL_TAGS = {"blobscan/trigger": "address_rollup_change"}

_ADDRESSES_IN_ALERT = 10


def changed_addresses(
    previous: Mapping[str, str], current: Mapping[str, str],
) -> list[str]:
    """Return the addresses whose rollup was set, changed or removed."""
    return sorted(
        address
        for address in previous.keys() | current.keys()
        if previous.get(address) != current.get(address)
    )


def backfill_start(first_sent_at: datetime | None, now: datetime) -> datetime | None:
    """Return the start of the window to re-aggregate, or None to skip it.

    The window starts at the hour of ``first_sent_at``, but not before the
    partitions start. Hours that the live schedules re-aggregate are skipped.
    """
    if first_sent_at is None:
        return None

    start = max(
        first_sent_at.replace(minute=0, second=0, microsecond=0),
        hourly_partitions.start,
    )
    live_from = now.replace(minute=0, second=0, microsecond=0) - timedelta(
        hours=LIVE_HOURS - 1,
    )
    return None if start >= live_from else start


def build_backfill_subset(start: datetime, now: datetime) -> AssetGraphSubset:
    """Select the partitions of every metrics level between start and now."""
    subsets = {}
    with dg.partition_loading_context(effective_dt=now):
        for asset in BACKFILL_ASSETS:
            partitions_def = asset.partitions_def
            keys = partitions_def.get_partition_keys_in_range(
                dg.PartitionKeyRange(
                    partitions_def.get_partition_key_for_timestamp(start.timestamp()),
                    partitions_def.get_partition_key_for_timestamp(now.timestamp()),
                ),
            )
            subsets[asset.key] = partitions_def.subset_with_partition_keys(keys)

    return AssetGraphSubset(partitions_subsets_by_asset_key=subsets)


def _format_addresses(addresses: list[str]) -> str:
    shown = ", ".join(f"`{a}`" for a in addresses[:_ADDRESSES_IN_ALERT])
    hidden = len(addresses) - _ADDRESSES_IN_ALERT
    return shown + (f" and {hidden} more" if hidden > 0 else "")


@dg.sensor(
    name="address_rollup_change_sensor",
    minimum_interval_seconds=5 * 60,
    default_status=dg.DefaultSensorStatus.RUNNING,
)
def address_rollup_change_sensor(
    context: dg.SensorEvaluationContext, postgres: PostgresResource,
):
    """Backfill the metrics of the addresses whose rollup changed.

    The cursor is a JSON object with the rollup of each labeled address. The
    first evaluation only stores it, so turning the sensor on doesn't launch a
    backfill. The cursor is updated together with the backfill request.
    """
    with postgres.get_connection() as conn:
        current = dict(conn.execute(ROLLUP_SNAPSHOT_SQL).tuples().all())

    cursor = json.dumps(current, sort_keys=True)

    if context.cursor is None:
        return dg.SensorResult(skip_reason="cursor initialized", cursor=cursor)

    changed = changed_addresses(json.loads(context.cursor), current)
    if not changed:
        return dg.SkipReason("no rollup changes")

    with postgres.get_connection() as conn:
        first_sent_at = conn.execute(
            FIRST_SENT_AT_SQL, {"addresses": changed},
        ).scalar()

    now = datetime.now(UTC)
    # The session time zone is UTC (see PostgresResource) and the column is a
    # naive timestamp.
    start = backfill_start(
        first_sent_at.replace(tzinfo=UTC) if first_sent_at else None, now,
    )
    if start is None:
        return dg.SensorResult(
            skip_reason=(
                f"{len(changed)} rollup change(s) with no aggregated hours "
                "to update"
            ),
            cursor=cursor,
        )

    send_alert(
        f":arrows_counterclockwise: The rollup of {len(changed)} address(es) "
        f"changed: {_format_addresses(changed)}. Launching a metrics backfill "
        f"from {start:%Y-%m-%dT%H:%M} UTC.",
        context.log,
    )
    return dg.SensorResult(
        run_requests=[
            dg.RunRequest.for_asset_graph_subset(
                build_backfill_subset(start, now), tags=BACKFILL_TAGS,
            ),
        ],
        cursor=cursor,
    )
