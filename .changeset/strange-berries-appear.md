---
"@blobscan/api": minor
"@blobscan/db": minor
"@blobscan/stats-aggregation-cli": patch
"@blobscan/stats-syncer": patch
---

Eliminated the need for the Beacon API endpoint in stats calculation by tracking the last finalized block in the database and utilizing it internally.
