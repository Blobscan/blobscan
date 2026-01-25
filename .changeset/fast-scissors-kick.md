---
"@blobscan/rest-api-server": patch
---

Added support for method-specific exclusions. Now filters out `PUT` and `POST` requests for `/indexer` and `/blockchain-sync-state` to prevent internal sync traffic from polluting analytics
