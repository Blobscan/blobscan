---
"@blobscan/rest-api-server": patch
---

Fixed an issue where the REST API could crash if auxiliary blob storages failed to initialize, even when the main storage was available
