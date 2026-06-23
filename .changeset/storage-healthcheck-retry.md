---
"@blobscan/blob-storage-manager": patch
---

Retry blob storage health checks on startup so a transient network failure (e.g. a premature connection close while fetching a GCS auth token) no longer aborts boot. The reachability probe now uses up to 4 attempts with exponential backoff and jitter before declaring a storage unreachable.
