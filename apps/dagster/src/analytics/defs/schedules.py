from datetime import timedelta

import dagster as dg

from .jobs import hourly_metrics_job


CATCH_UP_HOURS = 3


@dg.schedule(
    cron_schedule="5 * * * *",
    job=hourly_metrics_job,
)
def hourly_catch_up_schedule(context: dg.ScheduleEvaluationContext):
    """Re-aggregates the last completed hours at :05 to capture any late data.

    Captures data that arrived after the live sensor's last run before the
    hour rolled over, and reorgs (forked txs, re-included txs) that the
    indexer recorded after an hour was first aggregated.
    """
    current_hour = context.scheduled_execution_time.replace(
        minute=0, second=0, microsecond=0,
    )
    for hours_back in range(1, CATCH_UP_HOURS + 1):
        partition_key = (current_hour - timedelta(hours=hours_back)).strftime(
            "%Y-%m-%dT%H:%M",
        )
        yield dg.RunRequest(
            partition_key=partition_key,
            # Schedules returning multiple RunRequests must set a unique run_key
            run_key=f"{partition_key}@{current_hour.isoformat()}",
        )
