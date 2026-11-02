---
"@blobscan/dagster": patch
"@blobscan/web": patch
"@blobscan/rest-api-server": patch
---

Fix HIGH/CRITICAL vulnerabilities reported by Trivy.

- Dagster: upgrade the locked `certifi`, `cryptography`, `filelock`, `fsspec`, `mako`, `oauthlib`, `pyasn1` and `urllib3`
- Raise the `follow-redirects` override to 1.16.2
