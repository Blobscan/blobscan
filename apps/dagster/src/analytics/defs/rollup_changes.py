"""Re-aggregate the metrics after the rollup of an address changes.

The hourly SQL reads ``address.rollup`` when it runs, and the metrics tables
store the rollup of each row. A change of the rollup of an existing address
(a migration that labels a new batcher, or the indexer applying a new
registry) does not change the metrics that were already aggregated: the
blobs of that address keep the old attribution until their partitions are
aggregated again.

A trigger logs each change of ``address.rollup`` in the
``address_rollup_change`` table (see the
20261107000000_add_address_rollup_change_log migration). This sensor reads
the new rows of the log and launches a backfill of every metrics level, from
the first hour in which the changed addresses sent a transaction until now.
"""

from __future__ import annotations

from datetime import UTC, datetime

import dagster as dg

# Not exported from the top-level dagster package (1.13).
# RunRequest.for_asset_graph_subset takes it to launch a backfill.
from dagster._core.definitions.assets.graph.asset_graph_subset import (
    AssetGraphSubset,
)
from sqlalchemy import text

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

CHANGES_SQL = text(
    """
    SELECT id, address
    FROM address_rollup_change
    WHERE id > :after
    ORDER BY id
    LIMIT :limit
    """,
)

# One index lookup on (from_id, block_timestamp, index) per address. It does
# not use address.first_block_number_as_sender, which a reorg can set to NULL.
# A forked transaction can only make the window start earlier.
FIRST_SENT_AT_SQL = text(
    """
    SELECT MIN(
      (SELECT MIN(tx.block_timestamp) FROM transaction tx WHERE tx.from_id = a)
    )
    FROM unnest(CAST(:addresses AS text[])) AS a
    """,
)

# The changes that one evaluation reads. A larger log is read in the next
# evaluations, each one with its own backfill.
CHANGES_PER_EVALUATION = 1000

BACKFILL_ASSETS = (
    hourly_metrics,
    daily_metrics,
    weekly_metrics,
    monthly_metrics,
    yearly_metrics,
)

BACKFILL_TRIGGER_TAG = "blobscan/trigger"
BACKFILL_CHANGES_TAG = "blobscan/address_rollup_changes"

_ADDRESSES_IN_ALERT = 10


def backfill_start(first_sent_at: datetime) -> datetime:
    """Return the hour of ``first_sent_at``, but not before the partitions."""
    return max(
        first_sent_at.replace(minute=0, second=0, microsecond=0),
        hourly_partitions.start,
    )


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
    """Backfill the metrics of the addresses in the rollup change log.

    The cursor is the id of the last change that was read. Without a cursor,
    the sensor reads the log from the start, so it also handles the changes
    made before it ran for the first time. The cursor is updated together
    with the backfill request, so a failed evaluation reads the same changes
    again. To process changes again, set the cursor to an older id.
    """
    after = int(context.cursor or 0)

    with postgres.get_connection() as conn:
        changes = conn.execute(
            CHANGES_SQL, {"after": after, "limit": CHANGES_PER_EVALUATION},
        ).all()
        if not changes:
            return dg.SkipReason("no rollup changes")

        addresses = sorted({address for _, address in changes})
        first_sent_at = conn.execute(
            FIRST_SENT_AT_SQL, {"addresses": addresses},
        ).scalar()

    first_id, last_id = changes[0].id, changes[-1].id
    cursor = str(last_id)

    if first_sent_at is None:
        return dg.SensorResult(
            skip_reason=(
                f"rollup changes {first_id}..{last_id}: the addresses have "
                "sent no transactions"
            ),
            cursor=cursor,
        )

    now = datetime.now(UTC)
    # The session time zone is UTC (see PostgresResource) and the column is a
    # naive timestamp.
    start = backfill_start(first_sent_at.replace(tzinfo=UTC))
    request = dg.RunRequest.for_asset_graph_subset(
        build_backfill_subset(start, now),
        tags={
            BACKFILL_TRIGGER_TAG: "address_rollup_change",
            BACKFILL_CHANGES_TAG: f"{first_id}..{last_id}",
        },
    )

    # Last step before returning, so only a failed submission of the request
    # repeats the alert, together with the request.
    send_alert(
        f":arrows_counterclockwise: The rollup of {len(addresses)} address(es) "
        f"changed: {_format_addresses(addresses)}. Launching a metrics backfill "
        f"from {start:%Y-%m-%dT%H:%M} UTC (rollup changes {first_id}..{last_id}).",
        context.log,
    )
    return dg.SensorResult(run_requests=[request], cursor=cursor)
