from analytics.defs.assets import all_time_metrics, daily_metrics, hourly_metrics, monthly_metrics, weekly_metrics, yearly_metrics
import dagster as dg


all_time_metrics_job = dg.define_asset_job(
    name="all_time_metrics_job",
    selection=[all_time_metrics],
)

hourly_metrics_job = dg.define_asset_job(
    name="hourly_metrics_job",
    selection=[hourly_metrics]
)

daily_metrics_job = dg.define_asset_job(
    name="daily_metrics_job",
    selection=[daily_metrics]
)

weekly_metrics_job = dg.define_asset_job(
  name="weekly_metrics_job",
  selection=[weekly_metrics]
)

monthly_metrics_job = dg.define_asset_job(
  name="monthly_metrics_job",
  selection=[monthly_metrics]
)

yearly_metrics_job = dg.define_asset_job(
  name="yearly_metrics_job",
  selection=[yearly_metrics]
)