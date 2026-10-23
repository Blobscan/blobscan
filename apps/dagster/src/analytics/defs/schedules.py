from __future__ import annotations

from datetime import timedelta
from typing import TYPE_CHECKING

import dagster as dg

from .assets import hourly_partitions
from .jobs import all_time_metrics_job, hourly_metrics_job

if TYPE_CHECKING:
    from dagster._core.definitions.unresolved_asset_job_definition import (
        UnresolvedAssetJobDefinition,
    )


def _build_live_schedule(
    *,
    name: str,
    cron_schedule: str,
    job: UnresolvedAssetJobDefinition,
    partitions_def: dg.TimeWindowPartitionsDefinition,
) -> dg.ScheduleDefinition:
    """Build a schedule that refreshes the in-progress partition of ``job``.

    The partition key is derived from ``partitions_def`` itself, so the
    requested key always exists in the partition set.
    """

    @dg.schedule(name=name, cron_schedule=cron_schedule, job=job)
    def _schedule(context: dg.ScheduleEvaluationContext) -> dg.RunRequest:
        return dg.RunRequest(
            partition_key=partitions_def.get_partition_key_for_timestamp(
                context.scheduled_execution_time.timestamp(),
            ),
        )

    return _schedule


live_hourly_schedule = _build_live_schedule(
    name="live_hourly_schedule",
    cron_schedule="*/10 * * * *",  # every 10 minutes
    job=hourly_metrics_job,
    partitions_def=hourly_partitions,
)

# The current partitions of the rollup levels (daily, weekly, monthly, yearly)
# have no live schedule: their automation condition materializes them after
# each hourly update (see rollup_condition in assets.py).

# all_time_metrics is a full refresh, so it runs on a schedule and not after
# each update in the cascade. The 5-minute offset gives the cascade that the
# live hourly schedule starts time to complete.
#
# Before, an automation condition updated all_time_metrics, which needs no
# operator action. Thus this schedule is running by default, not stopped as
# the live schedules are. A run before the backfill completes is safe: it
# only reads the metrics tables.
all_time_metrics_schedule = dg.ScheduleDefinition(
    name="all_time_metrics_schedule",
    cron_schedule="5-59/10 * * * *",  # every 10 minutes, at :05, :15, ...
    job=all_time_metrics_job,
    default_status=dg.DefaultScheduleStatus.RUNNING,
)


CATCH_UP_HOURS = 3


@dg.schedule(
    cron_schedule="5 * * * *",
    job=hourly_metrics_job,
)
def hourly_catch_up_schedule(context: dg.ScheduleEvaluationContext):
    """Re-aggregates the last completed hours at :05 to capture any late data.

    Captures data that arrived after the live schedule's last run before the
    hour rolled over, and reorgs (forked txs, re-included txs) that the
    indexer recorded after an hour was first aggregated.
    """
    scheduled_at = context.scheduled_execution_time
    current_hour = scheduled_at.replace(minute=0, second=0, microsecond=0)
    for hours_back in range(1, CATCH_UP_HOURS + 1):
        partition_key = (current_hour - timedelta(hours=hours_back)).strftime(
            "%Y-%m-%dT%H:%M",
        )
        # Hours before the partitions start date (e.g. right after a fresh
        # deploy) are not in the partition set and would fail the tick.
        with dg.partition_loading_context(effective_dt=scheduled_at):
            if not hourly_partitions.has_partition_key(partition_key):
                continue
        yield dg.RunRequest(
            partition_key=partition_key,
            # Schedules returning multiple RunRequests must set a unique run_key
            run_key=f"{partition_key}@{current_hour.isoformat()}",
        )
