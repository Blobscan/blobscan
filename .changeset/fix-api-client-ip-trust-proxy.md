---
"@blobscan/rest-api-server": patch
---

Fixed the API logging internal proxy IPs to Matomo. The client-IP helper now relies on Express's `trust proxy` setting (configured from `TRUSTED_PROXIES`) via `req.ip` instead of reading the left-most `x-forwarded-for` entry directly, so it correctly resolves the real client IP behind internal proxy hops.
