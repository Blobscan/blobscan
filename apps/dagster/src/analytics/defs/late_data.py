"""Re-aggregate the hours of hourly_metrics that changed after they were aggregated.

The live and catch-up schedules aggregate each hour during its last 3 hours.
Data that the indexer writes later is not aggregated: for example, after an
outage of the indexer, the hours of the outage keep the metrics of the time
when they had no transactions, also after the indexer catches up.

``metrics_late_data_sensor`` compares, for each hour, the time when the
indexer last wrote a transaction or a fork of the hour (``inserted_at`` and
``updated_at``) with the time when hourly_metrics last aggregated the hour
(``hourly_metrics.updated_at``). It starts hourly_metrics runs for the hours
that changed, and the automation conditions of the rollup levels update the
days, weeks, months and years that contain them.

Both times are written by ``now()`` of the database, so they are compared in
SQL, not with the clock of the Dagster process. They are UTC times without a
time zone, like the block timestamps.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import TYPE_CHECKING

import dagster as dg
from sqlalchemy import text

from analytics.defs.alerts import send_alert
from analytics.defs.assets import hourly_partitions
from analytics.defs.jobs import hourly_metrics_job
from analytics.defs.resources.postgres import PostgresResource
from analytics.defs.schedules import CATCH_UP_HOURS

if TYPE_CHECKING:
    from collections.abc import Sequence

    from sqlalchemy.engine import Connection

# How far back the sensor looks for changed hours. Re-aggregate older hours
# with a backfill.
LATE_DATA_LOOKBACK = timedelta(days=30)
# An hour is re-aggregated only when the indexer has not written to it for
# this long, so an indexer that is catching up does not start a run for each
# block it writes.
LATE_DATA_SETTLE = timedelta(minutes=15)
# The backfill policy of hourly_metrics: at most one week of hours per run.
MAX_HOURS_PER_RUN = 24 * 7
# Changed hours that are at most this far apart go to the same run. An hour
# without changes in between is aggregated again, which is harmless.
MAX_HOURS_GAP = 24

LATE_DATA_TAG = "blobscan/late_data"
_RANGE_START_TAG = "dagster/asset_partition_range_start"
_RANGE_END_TAG = "dagster/asset_partition_range_end"

_HOUR = timedelta(hours=1)

# A transaction counts only when it is not forked, as in aggregate_tx_hourly.sql.
# A fork changes the hour of its block. An hour that was never aggregated is
# late only when it has transactions that are not forked: an hour whose
# transactions are all forked has no metrics rows.
LATE_HOURS_SQL = text(
    """
WITH changes AS (
  SELECT
    DATE_TRUNC('hour', tx.block_timestamp) AS period_start,
    MAX(GREATEST(tx.inserted_at, tx.updated_at)) AS changed_at,
    TRUE AS has_transactions
  FROM transaction tx
  WHERE tx.block_timestamp >= :from AND tx.block_timestamp < :to
    AND NOT EXISTS (
      SELECT 1 FROM transaction_fork tx_f
      WHERE tx_f.block_hash = tx.block_hash AND tx_f.hash = tx.hash
    )
  GROUP BY 1
  UNION ALL
  SELECT
    DATE_TRUNC('hour', b.timestamp) AS period_start,
    MAX(GREATEST(tx_f.inserted_at, tx_f.updated_at)) AS changed_at,
    FALSE AS has_transactions
  FROM transaction_fork tx_f
    JOIN block b ON b.hash = tx_f.block_hash
  WHERE b.timestamp >= :from AND b.timestamp < :to
  GROUP BY 1
),
hours AS (
  SELECT
    period_start,
    MAX(changed_at) AS changed_at,
    BOOL_OR(has_transactions) AS has_transactions
  FROM changes
  GROUP BY period_start
),
aggregated AS (
  SELECT period_start, MAX(updated_at) AS aggregated_at
  FROM hourly_metrics
  WHERE period_start >= :from AND period_start < :to
  GROUP BY period_start
)
SELECT h.period_start, h.changed_at, a.aggregated_at
FROM hours h
  LEFT JOIN aggregated a USING (period_start)
WHERE h.changed_at < (now() AT TIME ZONE 'UTC') - :settle
  AND CASE
    WHEN a.aggregated_at IS NULL THEN h.has_transactions
    ELSE h.changed_at > a.aggregated_at
  END
ORDER BY h.period_start
""",
)


@dataclass(frozen=True)
class LateHour:
    period_start: datetime
    changed_at: datetime
    aggregated_at: datetime | None


@dataclass(frozen=True)
class LateRange:
    first: datetime
    last: datetime
    changed_at: datetime
    late_hours: int

    @property
    def first_key(self) -> str:
        return _partition_key(self.first)

    @property
    def last_key(self) -> str:
        return _partition_key(self.last)

    @property
    def run_key(self) -> str:
        # A new change of the range gives a new key, and so a new run. The
        # same key is never launched twice, also when its run failed.
        changed_at = self.changed_at.isoformat()
        return f"late-data:{self.first_key}..{self.last_key}@{changed_at}"


def _partition_key(hour: datetime) -> str:
    return hour.strftime("%Y-%m-%dT%H:%M")


def _as_utc(value: datetime) -> datetime:
    return value.replace(tzinfo=UTC) if value.tzinfo is None else value


def late_data_window(now: datetime) -> tuple[datetime, datetime]:
    """Return the [start, end) hours that the sensor looks at.

    It ends before the hours that the hourly catch-up schedule re-aggregates.
    """
    end = now.replace(minute=0, second=0, microsecond=0) - timedelta(
        hours=CATCH_UP_HOURS,
    )
    start = max(end - LATE_DATA_LOOKBACK, hourly_partitions.start)
    return start, end


def find_late_hours(
    conn: Connection, start: datetime, end: datetime,
) -> list[LateHour]:
    params = {
        "from": start.astimezone(UTC).replace(tzinfo=None),
        "to": end.astimezone(UTC).replace(tzinfo=None),
        "settle": LATE_DATA_SETTLE,
    }
    return [
        LateHour(
            period_start=_as_utc(row.period_start),
            changed_at=row.changed_at,
            aggregated_at=row.aggregated_at,
        )
        for row in conn.execute(LATE_HOURS_SQL, params)
    ]


def group_late_hours(hours: Sequence[LateHour]) -> list[LateRange]:
    """Group the late hours into ranges of at most ``MAX_HOURS_PER_RUN`` hours."""
    ranges: list[LateRange] = []
    for hour in sorted(hours, key=lambda h: h.period_start):
        current = ranges[-1] if ranges else None
        if (
            current is not None
            and hour.period_start - current.last <= timedelta(hours=MAX_HOURS_GAP)
            and hour.period_start - current.first < MAX_HOURS_PER_RUN * _HOUR
        ):
            ranges[-1] = LateRange(
                first=current.first,
                last=hour.period_start,
                changed_at=max(current.changed_at, hour.changed_at),
                late_hours=current.late_hours + 1,
            )
        else:
            ranges.append(
                LateRange(
                    first=hour.period_start,
                    last=hour.period_start,
                    changed_at=hour.changed_at,
                    late_hours=1,
                ),
            )
    return ranges


def build_run_request(late_range: LateRange) -> dg.RunRequest:
    return dg.RunRequest(
        run_key=late_range.run_key,
        tags={
            _RANGE_START_TAG: late_range.first_key,
            _RANGE_END_TAG: late_range.last_key,
            LATE_DATA_TAG: "true",
        },
    )


def _describe(ranges: Sequence[LateRange]) -> str:
    lines = [
        f"- {r.first_key}..{r.last_key} ({r.late_hours} changed hour(s))"
        for r in ranges
    ]
    hours = sum(r.late_hours for r in ranges)
    return (
        f":arrows_counterclockwise: Re-aggregating {hours} hour(s) of"
        " hourly_metrics that the indexer changed after they were"
        " aggregated:\n" + "\n".join(lines)
    )


# Stopped by default, like the live schedules: before the initial backfill,
# every hour is missing and the sensor would aggregate the last 30 days.
@dg.sensor(
    name="metrics_late_data_sensor",
    job=hourly_metrics_job,
    minimum_interval_seconds=5 * 60,
    default_status=dg.DefaultSensorStatus.STOPPED,
)
def metrics_late_data_sensor(
    context: dg.SensorEvaluationContext, postgres: PostgresResource,
):
    """Start hourly_metrics runs for the hours that changed after aggregation.

    The cursor stores the run keys of the last evaluation (JSON), so each new
    range is alerted once. Dagster does not launch a run key twice.
    """
    start, end = late_data_window(datetime.now(UTC))
    if start >= end:
        return dg.SkipReason("No closed hour to look at yet.")

    with postgres.get_connection() as conn:
        late_hours = find_late_hours(conn, start, end)
    ranges = group_late_hours(late_hours)

    previous = set(json.loads(context.cursor)) if context.cursor else set()
    new_ranges = [r for r in ranges if r.run_key not in previous]
    if new_ranges:
        send_alert(_describe(new_ranges), context.log)
    context.update_cursor(json.dumps(sorted(r.run_key for r in ranges)))

    if not ranges:
        return dg.SkipReason("No hour changed after it was aggregated.")
    return [build_run_request(r) for r in ranges]
