---
"@blobscan/rest-api-server": minor
"@blobscan/env": minor
---

Add an optional limit on how often one client can fetch the same blob, transaction or block from the REST API (`API_REPEAT_LIMIT_MODE=off|log|enforce`, 6 requests per 60 seconds by default). It is off by default and fails open when Redis is unavailable.
