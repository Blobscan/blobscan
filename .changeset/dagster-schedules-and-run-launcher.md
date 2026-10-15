---
"@blobscan/dagster": patch
---

Replaced live metrics sensors with schedules that derive partition keys from the partition definitions, unblocked all-time metrics from missing upstream partitions, forwarded DATABASE_URL/CHAIN_ID and the Docker network to run containers, validated CHAIN_ID, and stopped the integration setup from creating migrations
