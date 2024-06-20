---
"@blobscan/rest-api-server": minor
"@blobscan/syncers": minor
---

Refactored the stats syncer package to support general-purpose synchronization workers/queues.

Key changes include:

    •	Renamed the package to syncers.
    •	Exported each syncer directly, removing the StatsSyncer managing entity.
