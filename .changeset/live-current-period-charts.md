---
"@blobscan/api": minor
"@blobscan/web": minor
"@blobscan/dagster": minor
---

Added the current period to the time series charts. `stats.getTimeseries` (`GET /stats/timeseries`) has a new optional `includeCurrentPeriod` input. When it is `true`, the response includes the current day, which is not complete, and gives its timestamp in `data.currentPeriod`. A line chart shows the current day as a dotted segment with a pulsing point. A bar chart shows it as a dashed pulsing bar. The charts refresh it every 5 minutes. Dagster now updates the current daily, weekly, monthly and yearly metrics after each hourly update. A new schedule, which is running by default, updates `all_time_metrics` every 10 minutes
