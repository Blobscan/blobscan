---
"@blobscan/rest-api-server": patch
---

Add `/health` and `/ready` endpoints for liveness and readiness probes. Readiness checks Postgres and Redis and returns `503` when either dependency is unavailable.
