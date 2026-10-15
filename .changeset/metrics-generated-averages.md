---
"@blobscan/db": minor
"@blobscan/dagster": patch
---

Made the metrics `avg_*` columns Postgres stored generated columns (total / count of the same row) and removed the average calculations from the Dagster aggregation SQL
