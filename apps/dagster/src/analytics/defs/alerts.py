from __future__ import annotations

import json
import os
import time
import urllib.request
from typing import TYPE_CHECKING

import dagster as dg

# Not exported from the top-level dagster package (1.13); the instance's
# get_backfills() API takes them as-is.
from dagster._core.execution.backfill import (
    BulkActionsFilter,
    BulkActionStatus,
    PartitionBackfill,
)

from analytics.defs.assets import hourly_metrics, hourly_partitions

if TYPE_CHECKING:
    import logging

# hourly_metrics is refreshed every 10 minutes by the live schedule, so not
# being updated for this long means the pipeline is stuck.
HOURLY_METRICS_STALE_AFTER_SECONDS = 30 * 60

_WEBHOOK_TIMEOUT_SECONDS = 10

# Terminal backfill states worth a page. CANCELED is left out: a person did it.
# FAILED is the backfill itself erroring out (e.g. its code location failing to
# load), which also cancels its queued runs: no run fails, so
# metrics_run_failure_alert never sees it.
BACKFILL_FAILURE_STATUSES = (
    BulkActionStatus.FAILED,
    BulkActionStatus.COMPLETED_FAILED,
)
_BACKFILLS_PER_EVALUATION = 50


def send_alert(
    text: str,
    log: logging.Logger | dg.DagsterLogManager | None = None,
) -> None:
    """Post ``text`` to DAGSTER_ALERT_WEBHOOK_URL (Slack-compatible payload).

    Always logs the alert; delivery errors are logged and never raised, so a
    broken webhook doesn't break the sensor that reports the problem.
    """
    logger = log or dg.get_dagster_logger()
    logger.warning(text)

    url = os.getenv("DAGSTER_ALERT_WEBHOOK_URL")
    if not url:
        return

    try:
        # Request() raises ValueError for a malformed URL (e.g. no scheme)
        request = urllib.request.Request(  # noqa: S310 - URL comes from deployment config
            url,
            data=json.dumps({"text": text}).encode(),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(request, timeout=_WEBHOOK_TIMEOUT_SECONDS):  # noqa: S310
            pass
    except (OSError, ValueError):
        logger.exception("Failed to deliver alert")


@dg.run_failure_sensor(
    name="metrics_run_failure_alert",
    default_status=dg.DefaultSensorStatus.RUNNING,
)
def metrics_run_failure_alert(context: dg.RunFailureSensorContext):
    run = context.dagster_run
    partition = run.tags.get("dagster/partition")
    message = context.failure_event.message or "unknown error"
    send_alert(
        f":rotating_light: Dagster run failed: job `{run.job_name}`"
        + (f", partition `{partition}`" if partition else "")
        + f", run `{run.run_id}`\n{message}",
        context.log,
    )


def last_live_update(instance: dg.DagsterInstance, now: float) -> float | None:
    """Return the time of the latest live update of hourly_metrics.

    Only the current and the previous hour partitions count. A backfill of
    older partitions does not show that the live schedule is running.
    """
    current_hour = hourly_partitions.get_partition_key_for_timestamp(now)
    previous_hour = hourly_partitions.get_partition_key_for_timestamp(
        now - 60 * 60,
    )
    result = instance.fetch_materializations(
        dg.AssetRecordsFilter(
            asset_key=hourly_metrics.key,
            asset_partitions=[current_hour, previous_hour],
        ),
        limit=1,
    )
    return result.records[0].timestamp if result.records else None


# Stopped by default, the same as the live schedules: enable it after them,
# or it alerts before the first live run.
@dg.sensor(
    name="hourly_metrics_staleness_alert",
    minimum_interval_seconds=5 * 60,
    default_status=dg.DefaultSensorStatus.STOPPED,
)
def hourly_metrics_staleness_alert(context: dg.SensorEvaluationContext):
    """Alert once when hourly_metrics goes stale, and once when it recovers.

    The cursor stores whether we're currently in a stale episode, so the
    alert isn't repeated on every evaluation.
    """
    last_update = last_live_update(context.instance, time.time())
    is_stale = (
        last_update is None
        or time.time() - last_update > HOURLY_METRICS_STALE_AFTER_SECONDS
    )
    was_stale = context.cursor == "stale"

    if is_stale and not was_stale:
        age = (
            f"{int((time.time() - last_update) // 60)} minutes ago"
            if last_update is not None
            else "never"
        )
        send_alert(
            f":warning: `hourly_metrics` is stale: last updated {age}.",
            context.log,
        )
    elif was_stale and not is_stale:
        send_alert(
            ":white_check_mark: `hourly_metrics` is updating again.",
            context.log,
        )

    context.update_cursor("stale" if is_stale else "fresh")
    return dg.SkipReason("stale" if is_stale else "fresh")


def backfill_end_time(backfill: PartitionBackfill) -> float:
    return backfill.backfill_end_timestamp or backfill.backfill_timestamp


@dg.sensor(
    name="backfill_failure_alert",
    minimum_interval_seconds=60,
    default_status=dg.DefaultSensorStatus.RUNNING,
)
def backfill_failure_alert(context: dg.SensorEvaluationContext):
    """Alert once per backfill that ends FAILED or COMPLETED_FAILED.

    The cursor is the end time of the newest backfill already reported. The
    first evaluation only sets it, so turning the sensor on doesn't report old
    backfills.
    """
    backfills = context.instance.get_backfills(
        filters=BulkActionsFilter(statuses=list(BACKFILL_FAILURE_STATUSES)),
        limit=_BACKFILLS_PER_EVALUATION,
    )
    if context.cursor is None:
        newest = max(map(backfill_end_time, backfills), default=time.time())
        context.update_cursor(str(newest))
        return dg.SkipReason("cursor initialized")

    reported_until = float(context.cursor)
    new_failures = sorted(
        (b for b in backfills if backfill_end_time(b) > reported_until),
        key=backfill_end_time,
    )
    for backfill in new_failures:
        error = backfill.error.message.strip() if backfill.error else None
        send_alert(
            f":rotating_light: Dagster backfill `{backfill.backfill_id}` "
            f"ended {backfill.status.value}"
            + (f": {backfill.title}" if backfill.title else "")
            + (f"\n{error}" if error else ""),
            context.log,
        )
        reported_until = backfill_end_time(backfill)

    context.update_cursor(str(reported_until))
    return dg.SkipReason(f"{len(new_failures)} failed backfill(s) reported")
