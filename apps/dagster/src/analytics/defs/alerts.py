from __future__ import annotations

import json
import os
import time
import urllib.request
from typing import TYPE_CHECKING

import dagster as dg

from analytics.defs.assets import hourly_metrics

if TYPE_CHECKING:
    import logging

# hourly_metrics is refreshed every 10 minutes by the live schedule, so not
# being updated for this long means the pipeline is stuck.
HOURLY_METRICS_STALE_AFTER_SECONDS = 30 * 60

_WEBHOOK_TIMEOUT_SECONDS = 10


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

    request = urllib.request.Request(  # noqa: S310 - URL comes from deployment config
        url,
        data=json.dumps({"text": text}).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=_WEBHOOK_TIMEOUT_SECONDS):  # noqa: S310
            pass
    except OSError:
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


@dg.sensor(
    name="hourly_metrics_staleness_alert",
    minimum_interval_seconds=5 * 60,
    default_status=dg.DefaultSensorStatus.RUNNING,
)
def hourly_metrics_staleness_alert(context: dg.SensorEvaluationContext):
    """Alert once when hourly_metrics goes stale, and once when it recovers.

    The cursor stores whether we're currently in a stale episode, so the
    alert isn't repeated on every evaluation.
    """
    event = context.instance.get_latest_materialization_event(hourly_metrics.key)
    last_update = event.timestamp if event else None
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
