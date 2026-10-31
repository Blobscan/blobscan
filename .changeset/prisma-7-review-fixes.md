---
"@blobscan/db": patch
"@blobscan/rest-api-server": patch
---

Fall back to `DATABASE_URL` when `DIRECT_URL` is unset, honor `schema`, `connection_limit` and `pool_timeout` URL params with the Prisma 7 pg adapter, record query durations in milliseconds, and make `/readyz` crash-safe with a shared in-flight check
