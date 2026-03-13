from datetime import timedelta

import dagster as dg

from .jobs import hourly_metrics_job


@dg.schedule(
    cron_schedule="5 * * * *",
    job=hourly_metrics_job,
)
def hourly_catch_up_schedule(context: dg.ScheduleEvaluationContext):
    """Re-aggregates the just-completed hour at :05 to capture any data
    that arrived after the live sensor's last run before the hour rolled over."""
    prev_hour = (context.scheduled_execution_time - timedelta(hours=1)).replace(
        minute=0, second=0, microsecond=0
    )
    return dg.RunRequest(
        partition_key=prev_hour.strftime("%Y-%m-%dT%H:%M"),
    )
