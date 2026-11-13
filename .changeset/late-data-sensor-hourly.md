---
"@blobscan/dagster": patch
---

Run `metrics_late_data_sensor` every hour instead of every 5 minutes. Late data is rare, and each evaluation scans the last 30 days, so an hourly check is enough.
