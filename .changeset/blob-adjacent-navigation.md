---
"@blobscan/api": minor
"@blobscan/web": minor
---

Added previous/next navigation to the blob details page. The arrows move to the adjacent blob in the same transaction, or to the previous/next transaction of the same block when the blob is the first/last one of its transaction.

The new `blob.getAdjacentBlob` procedure returns the previous or the next blob of a blob position, in the format of `blob.getByBlobId`. The page sends it only when the user clicks an arrow, and puts the blob in the cache of the next page.
