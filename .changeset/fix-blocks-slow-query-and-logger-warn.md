---
"@blobscan/api": patch
"@blobscan/rest-api-server": patch
---

Fixed slow GET /blocks queries when filtering by slot range by ordering on `slot` instead of `number` (~9.5s → ~5ms). Fixed a REST API crash from the Matomo middleware calling the non-existent `logger.warning()`.
