---
"@blobscan/api": minor
"@blobscan/rest-api-server": minor
---

Add `/healthz` and `/readyz` endpoints for liveness and readiness probes. Readiness checks Postgres and Redis and returns `503` when either dependency is unavailable.

`/healthcheck` keeps working but is deprecated: use `/healthz` for liveness checks that must not depend on Postgres or Redis, and `/readyz` when a check should include both dependencies.
