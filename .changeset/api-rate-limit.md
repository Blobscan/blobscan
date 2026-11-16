---
"@blobscan/rest-api-server": minor
"@blobscan/env": minor
"@blobscan/errors": minor
---

Added optional rate limits to the REST API, counted in Redis so they are exact across instances, with an allowlist for internal callers (`RATE_LIMIT_ALLOWLIST`): a per-client-IP limit (`RATE_LIMIT_REQUESTS_PER_SECOND`) and a repeat limit on how often one client IP can fetch the same blob, transaction or block (`RATE_LIMIT_REPEAT_REQUESTS` per `RATE_LIMIT_REPEAT_WINDOW_SECONDS`). Rejected requests get a 429 with a `Retry-After` header and a JSON body (`code`, `message` with the wait time and a contact address).
