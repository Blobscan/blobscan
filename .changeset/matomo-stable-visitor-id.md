---
"@blobscan/rest-api-server": patch
---

Fix Matomo unique visitor tracking by sending a stable `cid` (visitor ID) per client. Authenticated clients get a deterministic ID derived from their bearer token hash; anonymous clients fall back to an IP + User-Agent hash. Authenticated clients also get `uid` for cross-session tracking. Also fixed `pf_srv` to correctly measure request duration.
