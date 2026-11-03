---
"@blobscan/db": minor
"@blobscan/dagster": minor
"@blobscan/docs": patch
"@blobscan/api": minor
"@blobscan/web": minor
---

Add the `updated_at` column to the hourly, daily, weekly, monthly and yearly metrics tables. Dagster sets it each time it aggregates a period. The timeseries stats endpoint gives `currentPeriod.updatedAt`, the time of the last update of the current period. The series do not include it as a metric.

The chart tooltip of the current period shows a red pulse and "Live" next to the date, and the time of the last update below it (for example, "Updated 5 minutes ago"). The metrics docs describe the current period.

The existing rows get the time of the migration as their update time.
