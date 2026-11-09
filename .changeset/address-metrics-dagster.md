---
"@blobscan/db": minor
"@blobscan/dagster": minor
---

Add the metrics of each address. New tables keep the hourly (last 30 days), daily, weekly, monthly, yearly and all-time values of each address as sender and as receiver. New Dagster assets fill them, and a daily schedule deletes the hourly rows older than 30 days. As for the network metrics, the weekly and monthly values come from the daily rows, the yearly values come from the monthly rows, and the all-time values come from the closed years, months and days.
