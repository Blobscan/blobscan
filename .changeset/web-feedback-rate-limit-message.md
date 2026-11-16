---
"@blobscan/web": patch
---

The feedback endpoint now answers a rate-limited request with the same 429 body as the REST API (`code`, `message` with the wait time and a contact address) and a `Retry-After` header, instead of `{"message": "Rate limit exceeded"}`
