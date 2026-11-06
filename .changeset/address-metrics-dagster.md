---
"@blobscan/db": minor
"@blobscan/dagster": minor
---

Add the metrics of each address. Three new tables keep the hourly (last 30 days), daily and all-time values of each address as sender and as receiver. New Dagster assets fill them, and a daily schedule deletes the hourly rows older than 30 days.
