---
"@blobscan/rest-api-server": patch
---

Declared the `TRUSTED_PROXIES` env var in the Turbo config so Turbo accounts for it in task caching and no longer warns about an undeclared runtime env var.
