---
"@blobscan/rest-api-server": minor
"@blobscan/env": minor
---

Added an optional per-client-IP rate limit to the REST API, counted in Redis so it is exact across instances (`RATE_LIMIT_REQUESTS_PER_SECOND`), with an allowlist for internal callers (`RATE_LIMIT_ALLOWLIST`)
