---
"@blobscan/api": minor
"@blobscan/blob-storage-manager": minor
"@blobscan/docs": patch
"@blobscan/env": minor
"@blobscan/rest-api-server": minor
"@blobscan/syncers": minor
"@blobscan/web": minor
---

Remove the Swarm stamp job.

- `SwarmStorage` reads the batch ID from `SWARM_BATCH_ID`. It does not read it from the database.
- `SWARM_BATCH_ID` is required when `SWARM_STORAGE_ENABLED=true`.
- Remove the `SWARM_STAMP_CRON_PATTERN` env variable.
- Remove the `blobStoragesState.getState` procedure and the Swarm fields from the app state.
- Remove the Swarm blob data expiry indicator from the web app.
