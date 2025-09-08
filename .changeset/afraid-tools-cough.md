---
"@blobscan/blob-propagator": minor
---

Added a new worker to the blob propagator (reconciler) that periodically scans for orphaned blobs (not propagated to any storage) and re-creates propagation jobs to retry propagation.
