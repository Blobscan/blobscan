---
"@blobscan/blob-propagator": minor
---

Added a new worker to the blob propagator (reconciliator) that periodically scans for orphaned blobs (not propagated to any storage) and re-creates propagation jobs to retry propagation.
