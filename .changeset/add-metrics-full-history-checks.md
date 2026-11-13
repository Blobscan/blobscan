---
"@blobscan/dagster": minor
---

Add full-history metrics checks. The checks of the new `network_metrics_history` asset run the consistency checks on every period from the first partition, once a week on Sundays at 04:40 UTC, and can be executed by hand from the Dagster UI. They are not on the metrics assets, so backfills and Materialize runs do not run them. `metrics_check_alert` reports their failures too.
